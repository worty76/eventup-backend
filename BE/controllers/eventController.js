const { Event, Application } = require('../models');

// @desc    Get all events (public with filters)
// @route   GET /api/events
// @access  Public
exports.getEvents = async (req, res, next) => {
  try {
    const {
      keyword,
      location,
      salary,
      type,
      timeFrom,
      timeTo,
      urgent,
      page = 1,
      limit = 10
    } = req.query;

    // Build query
    const query = { status: 'RECRUITING' };

    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ];
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    if (type) {
      query.eventType = type;
    }

    if (urgent === 'true') {
      query.urgent = true;
    }

    if (timeFrom || timeTo) {
      query.startTime = {};
      if (timeFrom) query.startTime.$gte = new Date(timeFrom);
      if (timeTo) query.startTime.$lte = new Date(timeTo);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const events = await Event.find(query)
      .populate('btcId', 'email')
      .sort({ urgent: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Event.countDocuments(query);

    res.status(200).json({
      success: true,
      count: events.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: events
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single event
// @route   GET /api/events/:eventId
// @access  Public
exports.getEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId)
      .populate('btcId', 'email phone');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Increment views
    await event.incrementViews();

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create event (BTC only)
// @route   POST /api/btc/events
// @access  Private (BTC)
exports.createEvent = async (req, res, next) => {
  try {
    const user = req.user;

    // Check post limit
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const postsThisMonth = await Event.countDocuments({
      btcId: user._id,
      createdAt: { $gte: startOfMonth }
    });

    const postLimit = user.isPremiumActive() 
      ? parseInt(process.env.PREMIUM_POST_LIMIT) 
      : parseInt(process.env.FREE_POST_LIMIT);

    if (postsThisMonth >= postLimit) {
      return res.status(403).json({
        success: false,
        message: `You have reached your monthly post limit (${postLimit}). Upgrade to Premium for more posts.`
      });
    }

    // Check urgent feature (Premium only)
    if (req.body.urgent && !user.isPremiumActive()) {
      return res.status(403).json({
        success: false,
        message: 'Urgent posts are available for Premium members only'
      });
    }

    // Create event
    const event = await Event.create({
      ...req.body,
      btcId: user._id,
      status: 'RECRUITING'
    });

    // Update post count
    user.subscription.postUsed += 1;
    await user.save();

    res.status(201).json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update event
// @route   PUT /api/btc/events/:id
// @access  Private (BTC)
exports.updateEvent = async (req, res, next) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check ownership
    if (event.btcId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this event'
      });
    }

    event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete event
// @route   DELETE /api/btc/events/:id
// @access  Private (BTC)
exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check ownership
    if (event.btcId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this event'
      });
    }

    // Check if there are applications
    const applicationCount = await Application.countDocuments({ eventId: event._id });
    if (applicationCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete event with existing applications'
      });
    }

    await event.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get BTC's own events
// @route   GET /api/btc/events
// @access  Private (BTC)
exports.getMyEvents = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { btcId: req.user._id };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const events = await Event.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Event.countDocuments(query);

    res.status(200).json({
      success: true,
      count: events.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: events
    });
  } catch (error) {
    next(error);
  }
};
