const paypal = require("paypal-rest-sdk");

paypal.configure({
  mode: "sandbox",
  client_id: "AUvD_Fl3dgaLu7YWrX9nCZg842sJyROX0utcPulNsYDhMuEDDuwSyGA3b282MrNW0MiSlaRk2MPWEVp_",
  client_secret: "EDDHGL4v4knm55KD7xXMNT-LdoMSUxhcOe0aZZmLTzVKC4aTM1O6u8YU_UcjC_4I5WtP0DNcrA8NtnbE",
});

module.exports = paypal;