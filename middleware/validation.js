import { param, query, body, validationResult } from "express-validator";

const allowedTrails = ["pct"];

export const validateTrailName = param("trailName").isIn(allowedTrails).withMessage("Invalid trail name");

export const validateMile = param("mile").isFloat({ min: 0, max: 3000 }).withMessage("Invalid mile marker");

export const validateText = param("text").trim().isLength({ min: 1, max: 100 }).escape();

export const validateId = param("id").isMongoId().withMessage("Invalid ID format");

export const validateCoordinates = [
  query("north").isFloat({ min: -90, max: 90 }).withMessage("Invalid latitude"),
  query("south").isFloat({ min: -90, max: 90 }).withMessage("Invalid latitude"),
  query("east").isFloat({ min: -180, max: 180 }).withMessage("Invalid longitude"),
  query("west").isFloat({ min: -180, max: 180 }).withMessage("Invalid longitude")
];

export const validateDetail = query("detail").optional().isInt({ min: 0, max: 20 }).withMessage("Invalid detail level");

export const validateWaypointBody = [
  body("name").trim().isLength({ min: 1, max: 200 }).escape().withMessage("Invalid name"),
  body("loc").isArray({ min: 2, max: 2 }).withMessage("Location must be [lng, lat]"),
  body("loc.*").isFloat({ min: -180, max: 180 }).withMessage("Invalid coordinates"),
  body("halfmileDescription").optional().trim().escape()
];

export const validateWaypointUpdateBody = [
  body("name").trim().isLength({ min: 1, max: 200 }).escape().withMessage("Invalid name")
];

export const validateWaypointNameQuery = query("name").optional().trim().isLength({ min: 1, max: 200 }).escape();

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
