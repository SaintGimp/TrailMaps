import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as waypoints from "../domain/waypoints.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function exportWaypoints(trailName) {
  console.log(`Exporting waypoints for trail: ${trailName}`);

  const options = { trailName: trailName };
  const allWaypoints = await waypoints.getWaypoints(options);

  const exportedData = allWaypoints.map((wp) => {
    const exportItem = {
      trailName: trailName,
      name: wp.name,
      loc: wp.loc,
      seq: wp.seq
    };
    if (wp.halfmileName) exportItem.halfmileName = wp.halfmileName;
    if (wp.halfmileDescription) exportItem.halfmileDescription = wp.halfmileDescription;
    return exportItem;
  });

  const outputDir = path.join(__dirname, trailName);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, "exported-waypoints.json");
  fs.writeFileSync(outputPath, JSON.stringify(exportedData, null, 2));

  console.log(`Exported ${exportedData.length} waypoints to ${outputPath}`);
  return exportedData.length;
}
