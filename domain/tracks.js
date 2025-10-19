let dataService;

export function initialize(dataServiceToUse) {
  dataService = dataServiceToUse;
}

// TODO: pull this from the data store
var maxDetailevel = 16;

export async function findByArea(options) {
  var effectiveDetailLevel = Math.min(options.detailLevel, maxDetailevel);
  var collectionName = options.trailName + "_track" + effectiveDetailLevel;
  var searchTerms = {
    loc: {
      $within: {
        $box: [
          [parseFloat(options.west), parseFloat(options.south)],
          [parseFloat(options.east), parseFloat(options.north)]
        ]
      }
    }
  };
  var projection = { _id: 0, loc: 1 };
  var sortOrder = { seq: 1 };

  return await dataService.findArray(collectionName, searchTerms, projection, sortOrder);
}
