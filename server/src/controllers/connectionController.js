const mongoose = require('mongoose');
const Connection = require('../models/Connection');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const sanitizePopulateFields = '-passwordHash -__v -email';

const sendRequest = asyncHandler(async (request, response) => {
  const targetId = request.body.recipientId || request.body.recipient;
  const message = request.body.message ? String(request.body.message).trim() : '';

  if (!targetId || !mongoose.Types.ObjectId.isValid(targetId)) {
    throw new ApiError(400, 'Valid recipient ID is required.');
  }

  if (String(request.user.id) === String(targetId)) {
    throw new ApiError(400, 'Cannot send connection request to yourself.');
  }

  const recipientUser = await User.findById(targetId);
  if (!recipientUser || !recipientUser.isActive) {
    throw new ApiError(404, 'Recipient user not found.');
  }

  const existing = await Connection.findOne({
    $or: [
      { requester: request.user.id, recipient: targetId },
      { requester: targetId, recipient: request.user.id },
    ],
  });

  if (existing) {
    if (existing.status === 'accepted') {
      throw new ApiError(400, 'You are already connected with this user.');
    }

    if (existing.status === 'pending') {
      if (String(existing.requester) === String(request.user.id)) {
        throw new ApiError(400, 'Connection request already sent and pending.');
      } else {
        throw new ApiError(400, 'This user has already sent you a connection request. Please accept their request.');
      }
    }

    // If previously declined, allow renewing the request
    existing.requester = request.user.id;
    existing.recipient = targetId;
    existing.status = 'pending';
    existing.message = message;
    await existing.save();

    const populated = await Connection.findById(existing._id)
      .populate('requester', sanitizePopulateFields)
      .populate('recipient', sanitizePopulateFields);

    return response.status(200).json({
      success: true,
      message: 'Connection request renewed.',
      connection: populated,
    });
  }

  const newConnection = await Connection.create({
    requester: request.user.id,
    recipient: targetId,
    message,
    status: 'pending',
  });

  const populated = await Connection.findById(newConnection._id)
    .populate('requester', sanitizePopulateFields)
    .populate('recipient', sanitizePopulateFields);

  response.status(201).json({
    success: true,
    message: 'Connection request sent successfully.',
    connection: populated,
  });
});

const getConnections = asyncHandler(async (request, response) => {
  const currentUserId = request.user.id;
  const { status } = request.query;

  const query = {
    $or: [{ requester: currentUserId }, { recipient: currentUserId }],
  };

  if (status && ['pending', 'accepted', 'declined'].includes(status)) {
    query.status = status;
  }

  const connections = await Connection.find(query)
    .populate('requester', sanitizePopulateFields)
    .populate('recipient', sanitizePopulateFields)
    .sort({ updatedAt: -1 });

  const sent = connections.filter(
    (c) => String(c.requester?._id || c.requester) === String(currentUserId) && c.status === 'pending'
  );
  const received = connections.filter(
    (c) => String(c.recipient?._id || c.recipient) === String(currentUserId) && c.status === 'pending'
  );
  const accepted = connections.filter((c) => c.status === 'accepted');

  response.json({
    success: true,
    count: connections.length,
    connections,
    sent,
    received,
    accepted,
  });
});

const updateStatus = asyncHandler(async (request, response) => {
  const { id } = request.params;
  const { status } = request.body;

  if (!status || !['accepted', 'declined'].includes(status)) {
    throw new ApiError(400, 'Status must be either "accepted" or "declined".');
  }

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid connection ID provided.');
  }

  const connection = await Connection.findById(id);

  if (!connection) {
    throw new ApiError(404, 'Connection request not found.');
  }

  if (String(connection.recipient) !== String(request.user.id)) {
    throw new ApiError(403, 'Only the recipient can accept or decline this connection request.');
  }

  if (connection.status !== 'pending' && connection.status === status) {
    const populated = await Connection.findById(connection._id)
      .populate('requester', sanitizePopulateFields)
      .populate('recipient', sanitizePopulateFields);

    return response.json({
      success: true,
      message: `Connection request is already ${status}.`,
      connection: populated,
    });
  }

  connection.status = status;
  await connection.save();

  const populated = await Connection.findById(connection._id)
    .populate('requester', sanitizePopulateFields)
    .populate('recipient', sanitizePopulateFields);

  response.json({
    success: true,
    message: `Connection request ${status}.`,
    connection: populated,
  });
});

const getConnectionStatus = asyncHandler(async (request, response) => {
  const { targetUserId } = request.params;

  if (!targetUserId || !mongoose.Types.ObjectId.isValid(targetUserId)) {
    throw new ApiError(400, 'Invalid target user ID.');
  }

  const connection = await Connection.findOne({
    $or: [
      { requester: request.user.id, recipient: targetUserId },
      { requester: targetUserId, recipient: request.user.id },
    ],
  });

  if (!connection) {
    return response.json({
      success: true,
      status: 'none',
      connectionId: null,
    });
  }

  let relationState = connection.status;
  if (connection.status === 'pending') {
    relationState = String(connection.requester) === String(request.user.id) ? 'pending_sent' : 'pending_received';
  }

  response.json({
    success: true,
    status: relationState,
    connectionId: connection._id,
  });
});

module.exports = {
  sendRequest,
  getConnections,
  updateStatus,
  getConnectionStatus,
};
