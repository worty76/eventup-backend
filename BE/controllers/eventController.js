const { Event, Application } = require("../models");

// @desc    Get all events (public with filters)
// @route   GET /api/events
// @access  Public
exports.getEvents = async (req, res, next) => {
  try {
    const {
      keyword,
      location,
      salary,
      salaryRange, // 'low' (<500K), 'medium' (500K-1M), 'high' (>1M)
      type,
      timeFrom,
      timeTo,
      urgent,
      page = 1,
      limit = 10,
    } = req.query;

    // Build query
    const query = { status: "RECRUITING" };

    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
      ];
    }

    if (location) {
      query.location = { $regex: location, $options: "i" };
    }

    if (type) {
      query.eventType = type;
    }

    if (urgent === "true") {
      query.urgent = true;
    }

    if (timeFrom || timeTo) {
      query.startTime = {};
      if (timeFrom) query.startTime.$gte = new Date(timeFrom);
      if (timeTo) query.startTime.$lte = new Date(timeTo);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Helper function to parse salary string to number (in VND)
    // Vietnamese format uses dots as thousand separators: "500.000 VNĐ/ngày" = 500,000 VND
    const parseSalary = (salaryStr) => {
      if (!salaryStr) return 0;
      // Remove all non-digit characters to extract the number
      const numbers = salaryStr.replace(/[^0-9]/g, "");
      return parseInt(numbers) || 0;
    };

    // Execute query
    let events = await Event.find(query)
      .populate("btcId", "email")
      .sort({ urgent: -1, createdAt: -1 });

    // Apply salary range filter in-memory (since salary is stored as string)
    if (salaryRange) {
      events = events.filter((event) => {
        const salaryValue = parseSalary(event.salary);
        if (salaryRange === "low") {
          return salaryValue < 500000;
        } else if (salaryRange === "medium") {
          return salaryValue >= 500000 && salaryValue <= 1000000;
        } else if (salaryRange === "high") {
          return salaryValue > 1000000;
        }
        return true;
      });
    }

    // Apply pagination after filtering
    const total = events.length;
    const paginatedEvents = events.slice(skip, skip + parseInt(limit));

    res.status(200).json({
      success: true,
      count: paginatedEvents.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: paginatedEvents,
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
    const event = await Event.findById(req.params.eventId).populate({
      path: "btcId",
      select: "email phone agencyName fullName avatarUrl",
      populate: { path: "btcProfile" },
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Increment views
    await event.incrementViews();

    // Calculate successful events count (events with COMPLETED status)
    const completedEventsCount = await Event.countDocuments({
      btcId: event.btcId._id,
      status: "COMPLETED",
    });

    const eventObj = event.toObject();
    if (eventObj.btcId && eventObj.btcId.btcProfile) {
      eventObj.btcId.btcProfile.successfulEventsCount = completedEventsCount;
    }

    // Check if user has applied (if authenticated)
    if (req.user) {
      const application = await Application.findOne({
        eventId: event._id,
        ctvId: req.user._id,
      });
      eventObj.isApplied = !!application;
    }

    res.status(200).json({
      success: true,
      data: eventObj,
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
      createdAt: { $gte: startOfMonth },
    });

    // Default limits if not in env
    const FREE_POST_LIMIT = parseInt(process.env.FREE_POST_LIMIT || "3");
    const PREMIUM_POST_LIMIT = parseInt(process.env.PREMIUM_POST_LIMIT || "15");
    const PREMIUM_URGENT_LIMIT = 3;

    const postLimit = user.isPremiumActive()
      ? PREMIUM_POST_LIMIT
      : FREE_POST_LIMIT;

    if (postsThisMonth >= postLimit) {
      return res.status(403).json({
        success: false,
        message: `You have reached your monthly post limit (${postLimit}). ${
          !user.isPremiumActive() ? "Upgrade to Premium for more posts." : ""
        }`,
      });
    }

    // Check urgent feature (Premium only)
    if (req.body.urgent) {
      if (!user.isPremiumActive()) {
        return res.status(403).json({
          success: false,
          message: "Urgent posts are available for Premium members only",
        });
      }

      // Check urgent limit
      const urgentPostsThisMonth = await Event.countDocuments({
        btcId: user._id,
        urgent: true,
        createdAt: { $gte: startOfMonth },
      });

      if (urgentPostsThisMonth >= PREMIUM_URGENT_LIMIT) {
        return res.status(403).json({
          success: false,
          message: `You have reached your monthly urgent post limit (${PREMIUM_URGENT_LIMIT}).`,
        });
      }
    }

    // Validate dates
    const { startTime, endTime, deadline } = req.body;
    if (startTime && endTime && new Date(startTime) >= new Date(endTime)) {
      return res.status(400).json({
        success: false,
        message: "Thời gian kết thúc phải sau thời gian bắt đầu",
      });
    }

    if (deadline && startTime && new Date(deadline) > new Date(startTime)) {
      return res.status(400).json({
        success: false,
        message: "Hạn ứng tuyển phải trước thời gian bắt đầu",
      });
    }

    // Create event
    const event = await Event.create({
      ...req.body,
      btcId: user._id,
      status: "RECRUITING",
    });

    res.status(201).json({
      success: true,
      data: event,
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
        message: "Event not found",
      });
    }

    // Check ownership
    if (event.btcId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this event",
      });
    }

    event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: event,
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
        message: "Event not found",
      });
    }

    // Check ownership
    if (event.btcId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this event",
      });
    }

    // Check if there are applications
    const applicationCount = await Application.countDocuments({
      eventId: event._id,
    });
    if (applicationCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete event with existing applications",
      });
    }

    await event.deleteOne();

    res.status(200).json({
      success: true,
      message: "Event deleted successfully",
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
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get BTC dashboard stats
// @route   GET /api/events/btc/dashboard/stats
// @access  Private (BTC)
exports.getDashboardStats = async (req, res, next) => {
  try {
    const btcId = req.user._id;

    // 1. Active Events (Status 'RECRUITING')
    const activeEventsCount = await Event.countDocuments({
      btcId,
      status: "RECRUITING",
    });

    // 2. Total Views
    const events = await Event.find({ btcId }).select("views");
    const totalViews = events.reduce((acc, curr) => acc + (curr.views || 0), 0);

    // 3. New Applications (Pending)
    const eventIds = events.map((e) => e._id);
    const pendingApplications = await Application.countDocuments({
      eventId: { $in: eventIds },
      status: "PENDING",
    });

    // 4. Chart Data (Last 7 days applications)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const applications = await Application.aggregate([
      {
        $match: {
          eventId: { $in: eventIds },
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill missing days
    const chartData = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateString = d.toISOString().split("T")[0];
      const found = applications.find((a) => a._id === dateString);

      // Format date as DD/MM for display
      const displayDate = `${d.getDate()}/${d.getMonth() + 1}`;

      chartData.push({
        name: displayDate, // DD/MM
        fullDate: dateString,
        value: found ? found.count : 0,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        activeEvents: activeEventsCount,
        totalViews,
        pendingApplications,
        chartData,
      },
    });
  } catch (error) {
    next(error);
  }
};
