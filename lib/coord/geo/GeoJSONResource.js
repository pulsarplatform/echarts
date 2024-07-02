
/*
* Licensed to the Apache Software Foundation (ASF) under one
* or more contributor license agreements.  See the NOTICE file
* distributed with this work for additional information
* regarding copyright ownership.  The ASF licenses this file
* to you under the Apache License, Version 2.0 (the
* "License"); you may not use this file except in compliance
* with the License.  You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing,
* software distributed under the License is distributed on an
* "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
* KIND, either express or implied.  See the License for the
* specific language governing permissions and limitations
* under the License.
*/


/**
 * AUTO-GENERATED FILE. DO NOT MODIFY.
 */

/*
* Licensed to the Apache Software Foundation (ASF) under one
* or more contributor license agreements.  See the NOTICE file
* distributed with this work for additional information
* regarding copyright ownership.  The ASF licenses this file
* to you under the Apache License, Version 2.0 (the
* "License"); you may not use this file except in compliance
* with the License.  You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing,
* software distributed under the License is distributed on an
* "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
* KIND, either express or implied.  See the License for the
* specific language governing permissions and limitations
* under the License.
*/
import { each, isString, createHashMap, hasOwn } from 'zrender/lib/core/util.js';
import parseGeoJson from './parseGeoJson.js';
// Built-in GEO fixer.
import fixNanhai from './fix/nanhai.js';
import fixTextCoord from './fix/textCoord.js';
import fixDiaoyuIsland from './fix/diaoyuIsland.js';
import BoundingRect from 'zrender/lib/core/BoundingRect.js';
const DEFAULT_NAME_PROPERTY = 'name';
export class GeoJSONResource {
  constructor(mapName, geoJSON, specialAreas) {
    this.type = 'geoJSON';
    this._parsedMap = createHashMap();
    this._mapName = mapName;
    this._specialAreas = specialAreas;
    // PENDING: delay the parse to the first usage to rapid up the FMP?
    this._geoJSON = parseInput(geoJSON);
  }
  /**
   * @param nameMap can be null/undefined
   * @param nameProperty can be null/undefined
   */
  load(nameMap, nameProperty) {
    nameProperty = nameProperty || DEFAULT_NAME_PROPERTY;
    let parsed = this._parsedMap.get(nameProperty);
    if (!parsed) {
      const rawRegions = this._parseToRegions(nameProperty);
      parsed = this._parsedMap.set(nameProperty, {
        regions: rawRegions,
        boundingRect: calculateBoundingRect(rawRegions)
      });
    }
    const regionsMap = createHashMap();
    const finalRegions = [];
    each(parsed.regions, function (region) {
      let regionName = region.name;
      // Try use the alias in geoNameMap
      if (nameMap && hasOwn(nameMap, regionName)) {
        region = region.cloneShallow(regionName = nameMap[regionName]);
      }
      finalRegions.push(region);
      regionsMap.set(regionName, region);
    });
    return {
      regions: finalRegions,
      boundingRect: parsed.boundingRect || new BoundingRect(0, 0, 0, 0),
      regionsMap: regionsMap
    };
  }
  _parseToRegions(nameProperty) {
    const mapName = this._mapName;
    const geoJSON = this._geoJSON;
    let rawRegions;
    // https://jsperf.com/try-catch-performance-overhead
    try {
      rawRegions = geoJSON ? parseGeoJson(geoJSON, nameProperty) : [];
    } catch (e) {
      throw new Error('Invalid geoJson format\n' + e.message);
    }
    fixNanhai(mapName, rawRegions);
    each(rawRegions, function (region) {
      const regionName = region.name;
      fixTextCoord(mapName, region);
      fixDiaoyuIsland(mapName, region);
      // Some area like Alaska in USA map needs to be tansformed
      // to look better
      const specialArea = this._specialAreas && this._specialAreas[regionName];
      if (specialArea) {
        region.transformTo(specialArea.left, specialArea.top, specialArea.width, specialArea.height);
      }
    }, this);
    return rawRegions;
  }
  /**
   * Only for exporting to users.
   * **MUST NOT** used internally.
   */
  getMapForUser() {
    return {
      // For backward compatibility, use geoJson
      // PENDING: it has been returning them without clone.
      // do we need to avoid outsite modification?
      geoJson: this._geoJSON,
      geoJSON: this._geoJSON,
      specialAreas: this._specialAreas
    };
  }
}
function calculateBoundingRect(regions) {
  let rect;
  for (let i = 0; i < regions.length; i++) {
    const regionRect = regions[i].getBoundingRect();
    rect = rect || regionRect.clone();
    rect.union(regionRect);
  }
  return rect;
}
function parseInput(source) {
  return !isString(source) ? source : typeof JSON !== 'undefined' && JSON.parse ? JSON.parse(source) : new Function('return (' + source + ');')();
}