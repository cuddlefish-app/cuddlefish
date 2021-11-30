export const CF_APP_EMAIL =
  process.env.NODE_ENV === "production"
    ? "bloop@email.cuddlefish.app"
    : "bloop@email-dev.cuddlefish.app";
