const Newsletter = require('../../models/newsletter');

// Controller function for subscribing a new email
const subscribeToNewsletter = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const existingSubscriber = await Newsletter.findOne({ email });

    if (existingSubscriber) {
      if (existingSubscriber.isSubscribed) {
        return res.status(400).json({ error: 'This email is already subscribed.' });
      } else {
        // If previously unsubscribed, resubscribe them
        existingSubscriber.isSubscribed = true;
        await existingSubscriber.save();
        return res.status(200).json({ message: 'Successfully resubscribed to the newsletter!' });
      }
    }

    const newSubscription = new Newsletter({ email });
    await newSubscription.save();

    return res.status(201).json({ message: 'Successfully subscribed to the newsletter!' });
  } catch (err) {
    return res.status(500).json({ error: 'Error subscribing to the newsletter.' });
  }
};

const unsubscribeFromNewsletter = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const subscriber = await Newsletter.findOne({ email });

    if (!subscriber) {
      return res.status(404).json({ error: 'No subscription found for this email.' });
    }

    // Delete the subscriber instead of just marking as unsubscribed
    await Newsletter.deleteOne({ email });

    return res.status(200).json({ message: 'Successfully unsubscribed and removed from the newsletter.' });
  } catch (err) {
    console.error('Error unsubscribing:', err);
    return res.status(500).json({ error: 'Error unsubscribing from the newsletter.' });
  }
};

const getSubscribers = async (req, res) => {
  try {
    const subscribers = await Newsletter.find({}, 'email'); // Get all subscribers since we're not using isSubscribed anymore
    res.json(subscribers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getSubscribers, subscribeToNewsletter, unsubscribeFromNewsletter };
