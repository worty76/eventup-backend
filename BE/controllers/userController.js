const { User, CTVProfile, BTCProfile } = require("../models");

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    let profile = null;
    if (user.role === "CTV") {
      profile = await CTVProfile.findOne({ userId: user._id });
    } else if (user.role === "BTC") {
      profile = await BTCProfile.findOne({ userId: user._id });
    }

    res.status(200).json({
      success: true,
      data: {
        user,
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current user profile
// @route   PUT /api/users/me
// @access  Private
exports.updateMe = async (req, res, next) => {
  try {
    const { phone, ...profileData } = req.body;

    // Update user basic info
    if (phone) {
      await User.findByIdAndUpdate(req.user._id, { phone });
    }

    // Update profile based on role
    let profile;
    if (req.user.role === "CTV") {
      profile = await CTVProfile.findOneAndUpdate(
        { userId: req.user._id },
        profileData,
        { new: true, runValidators: true },
      );
    } else if (req.user.role === "BTC") {
      profile = await BTCProfile.findOneAndUpdate(
        { userId: req.user._id },
        profileData,
        { new: true, runValidators: true },
      );
    }

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get CTV CV/Profile
// @route   GET /api/ctv/cv
// @access  Private (CTV only)
exports.getCTVCV = async (req, res, next) => {
  try {
    const profile = await CTVProfile.findOne({ userId: req.user._id }).populate(
      "joinedEvents.eventId",
      "title eventType startTime endTime",
    );

    if (!profile) {
      return res.status(200).json({
        success: true,
        data: null,
      });
    }

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update CTV CV/Profile
// @route   PUT /api/ctv/cv
// @access  Private (CTV only)
exports.updateCTVCV = async (req, res, next) => {
  try {
    const { fullName, avatar, gender, address, skills, experiences } = req.body;

    const profile = await CTVProfile.findOneAndUpdate(
      { userId: req.user._id },
      { fullName, avatar, gender, address, skills, experiences },
      {
        new: true,
        runValidators: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get BTC Profile
// @route   GET /api/btc/profile
// @access  Private (BTC only)
exports.getBTCProfile = async (req, res, next) => {
  try {
    const profile = await BTCProfile.findOne({ userId: req.user._id }).populate(
      "successfulEvents",
      "title eventType startTime endTime poster location salary description urgent status",
    );

    if (!profile) {
      return res.status(200).json({
        success: true,
        data: null,
      });
    }

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update BTC Profile
// @route   PUT /api/btc/profile
// @access  Private (BTC only)
exports.updateBTCProfile = async (req, res, next) => {
  try {
    const { agencyName, logo, address, website, fanpage, description } =
      req.body;

    const profile = await BTCProfile.findOneAndUpdate(
      { userId: req.user._id },
      { agencyName, logo, address, website, fanpage, description },
      {
        new: true,
        runValidators: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get public BTC Profile by ID
// @route   GET /api/users/btc/:id/public
// @access  Public
exports.getPublicBTCProfile = async (req, res, next) => {
  try {
    const { Review, Event } = require("../models");

    const profile = await BTCProfile.findById(req.params.id)
      .populate("userId", "email phone fullName status")
      .populate(
        "successfulEvents",
        "title eventType startTime endTime poster location salary status",
      );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hồ sơ BTC",
      });
    }

    // Get reviews for this BTC (CTV_TO_BTC reviews)
    const reviews = await Review.find({
      toUser: profile.userId._id || profile.userId,
      reviewType: "CTV_TO_BTC",
    })
      .populate("fromUser", "fullName email")
      .populate("eventId", "title")
      .sort({ createdAt: -1 })
      .limit(20);

    // Get all events by this BTC
    const allEvents = await Event.find({
      btcId: profile.userId._id || profile.userId,
    })
      .select(
        "title eventType startTime endTime poster location salary status urgent createdAt",
      )
      .sort({ createdAt: -1 });

    // Separate events by status
    const now = new Date();
    const pastEvents = allEvents.filter(
      (e) => new Date(e.endTime) < now || e.status === "COMPLETED",
    );
    const ongoingEvents = allEvents.filter(
      (e) =>
        new Date(e.startTime) <= now &&
        new Date(e.endTime) >= now &&
        e.status !== "COMPLETED",
    );
    const upcomingEvents = allEvents.filter(
      (e) => new Date(e.startTime) > now && e.status !== "COMPLETED",
    );

    res.status(200).json({
      success: true,
      data: {
        profile,
        reviews,
        events: {
          past: pastEvents,
          ongoing: ongoingEvents,
          upcoming: upcomingEvents,
          all: allEvents,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get public CTV Profile by ID
// @route   GET /api/users/ctv/:id/public
// @access  Public
exports.getPublicCTVProfile = async (req, res, next) => {
  try {
    const { Review } = require("../models");

    const profile = await CTVProfile.findById(req.params.id)
      .populate("userId", "email phone fullName status")
      .populate(
        "joinedEvents.eventId",
        "title eventType startTime endTime poster location status",
      );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hồ sơ CTV",
      });
    }

    // Get reviews for this CTV (BTC_TO_CTV reviews)
    const reviews = await Review.find({
      toUser: profile.userId._id || profile.userId,
      reviewType: "BTC_TO_CTV",
    })
      .populate("fromUser", "fullName email")
      .populate("eventId", "title")
      .sort({ createdAt: -1 })
      .limit(20);

    // Categorize joined events
    const now = new Date();
    const joinedEvents = profile.joinedEvents || [];

    const pastEvents = joinedEvents.filter((e) => {
      const event = e.eventId;
      if (!event || typeof event === "string") return false;
      return new Date(event.endTime) < now || event.status === "COMPLETED";
    });

    const ongoingEvents = joinedEvents.filter((e) => {
      const event = e.eventId;
      if (!event || typeof event === "string") return false;
      return (
        new Date(event.startTime) <= now &&
        new Date(event.endTime) >= now &&
        event.status !== "COMPLETED"
      );
    });

    const upcomingEvents = joinedEvents.filter((e) => {
      const event = e.eventId;
      if (!event || typeof event === "string") return false;
      return new Date(event.startTime) > now && event.status !== "COMPLETED";
    });

    res.status(200).json({
      success: true,
      data: {
        profile,
        reviews,
        events: {
          past: pastEvents,
          ongoing: ongoingEvents,
          upcoming: upcomingEvents,
          all: joinedEvents,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
