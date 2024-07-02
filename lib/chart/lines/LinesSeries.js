
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
/* global Uint32Array, Float64Array, Float32Array */
import SeriesModel from '../../model/Series.js';
import SeriesData from '../../data/SeriesData.js';
import { concatArray, mergeAll, map, isNumber } from 'zrender/lib/core/util.js';
import CoordinateSystem from '../../core/CoordinateSystem.js';
import { createTooltipMarkup } from '../../component/tooltip/tooltipMarkup.js';
const Uint32Arr = typeof Uint32Array === 'undefined' ? Array : Uint32Array;
const Float64Arr = typeof Float64Array === 'undefined' ? Array : Float64Array;
function compatEc2(seriesOpt) {
  const data = seriesOpt.data;
  if (data && data[0] && data[0][0] && data[0][0].coord) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Lines data configuration has been changed to' + ' { coords:[[1,2],[2,3]] }');
    }
    seriesOpt.data = map(data, function (itemOpt) {
      const coords = [itemOpt[0].coord, itemOpt[1].coord];
      const target = {
        coords: coords
      };
      if (itemOpt[0].name) {
        target.fromName = itemOpt[0].name;
      }
      if (itemOpt[1].name) {
        target.toName = itemOpt[1].name;
      }
      return mergeAll([target, itemOpt[0], itemOpt[1]]);
    });
  }
}
class LinesSeriesModel extends SeriesModel {
  constructor() {
    super(...arguments);
    this.type = LinesSeriesModel.type;
    this.visualStyleAccessPath = 'lineStyle';
    this.visualDrawType = 'stroke';
  }
  init(option) {
    // The input data may be null/undefined.
    option.data = option.data || [];
    // Not using preprocessor because mergeOption may not have series.type
    compatEc2(option);
    const result = this._processFlatCoordsArray(option.data);
    this._flatCoords = result.flatCoords;
    this._flatCoordsOffset = result.flatCoordsOffset;
    if (result.flatCoords) {
      option.data = new Float32Array(result.count);
    }
    super.init.apply(this, arguments);
  }
  mergeOption(option) {
    compatEc2(option);
    if (option.data) {
      // Only update when have option data to merge.
      const result = this._processFlatCoordsArray(option.data);
      this._flatCoords = result.flatCoords;
      this._flatCoordsOffset = result.flatCoordsOffset;
      if (result.flatCoords) {
        option.data = new Float32Array(result.count);
      }
    }
    super.mergeOption.apply(this, arguments);
  }
  appendData(params) {
    const result = this._processFlatCoordsArray(params.data);
    if (result.flatCoords) {
      if (!this._flatCoords) {
        this._flatCoords = result.flatCoords;
        this._flatCoordsOffset = result.flatCoordsOffset;
      } else {
        this._flatCoords = concatArray(this._flatCoords, result.flatCoords);
        this._flatCoordsOffset = concatArray(this._flatCoordsOffset, result.flatCoordsOffset);
      }
      params.data = new Float32Array(result.count);
    }
    this.getRawData().appendData(params.data);
  }
  _getCoordsFromItemModel(idx) {
    const itemModel = this.getData().getItemModel(idx);
    const coords = itemModel.option instanceof Array ? itemModel.option : itemModel.getShallow('coords');
    if (process.env.NODE_ENV !== 'production') {
      if (!(coords instanceof Array && coords.length > 0 && coords[0] instanceof Array)) {
        throw new Error('Invalid coords ' + JSON.stringify(coords) + '. Lines must have 2d coords array in data item.');
      }
    }
    return coords;
  }
  getLineCoordsCount(idx) {
    if (this._flatCoordsOffset) {
      return this._flatCoordsOffset[idx * 2 + 1];
    } else {
      return this._getCoordsFromItemModel(idx).length;
    }
  }
  getLineCoords(idx, out) {
    if (this._flatCoordsOffset) {
      const offset = this._flatCoordsOffset[idx * 2];
      const len = this._flatCoordsOffset[idx * 2 + 1];
      for (let i = 0; i < len; i++) {
        out[i] = out[i] || [];
        out[i][0] = this._flatCoords[offset + i * 2];
        out[i][1] = this._flatCoords[offset + i * 2 + 1];
      }
      return len;
    } else {
      const coords = this._getCoordsFromItemModel(idx);
      for (let i = 0; i < coords.length; i++) {
        out[i] = out[i] || [];
        out[i][0] = coords[i][0];
        out[i][1] = coords[i][1];
      }
      return coords.length;
    }
  }
  _processFlatCoordsArray(data) {
    let startOffset = 0;
    if (this._flatCoords) {
      startOffset = this._flatCoords.length;
    }
    // Stored as a typed array. In format
    // Points Count(2) | x | y | x | y | Points Count(3) | x |  y | x | y | x | y |
    if (isNumber(data[0])) {
      const len = data.length;
      // Store offset and len of each segment
      const coordsOffsetAndLenStorage = new Uint32Arr(len);
      const coordsStorage = new Float64Arr(len);
      let coordsCursor = 0;
      let offsetCursor = 0;
      let dataCount = 0;
      for (let i = 0; i < len;) {
        dataCount++;
        const count = data[i++];
        // Offset
        coordsOffsetAndLenStorage[offsetCursor++] = coordsCursor + startOffset;
        // Len
        coordsOffsetAndLenStorage[offsetCursor++] = count;
        for (let k = 0; k < count; k++) {
          const x = data[i++];
          const y = data[i++];
          coordsStorage[coordsCursor++] = x;
          coordsStorage[coordsCursor++] = y;
          if (i > len) {
            if (process.env.NODE_ENV !== 'production') {
              throw new Error('Invalid data format.');
            }
          }
        }
      }
      return {
        flatCoordsOffset: new Uint32Array(coordsOffsetAndLenStorage.buffer, 0, offsetCursor),
        flatCoords: coordsStorage,
        count: dataCount
      };
    }
    return {
      flatCoordsOffset: null,
      flatCoords: null,
      count: data.length
    };
  }
  getInitialData(option, ecModel) {
    if (process.env.NODE_ENV !== 'production') {
      const CoordSys = CoordinateSystem.get(option.coordinateSystem);
      if (!CoordSys) {
        throw new Error('Unknown coordinate system ' + option.coordinateSystem);
      }
    }
    const lineData = new SeriesData(['value'], this);
    lineData.hasItemOption = false;
    lineData.initData(option.data, [], function (dataItem, dimName, dataIndex, dimIndex) {
      // dataItem is simply coords
      if (dataItem instanceof Array) {
        return NaN;
      } else {
        lineData.hasItemOption = true;
        const value = dataItem.value;
        if (value != null) {
          return value instanceof Array ? value[dimIndex] : value;
        }
      }
    });
    return lineData;
  }
  formatTooltip(dataIndex, multipleSeries, dataType) {
    const data = this.getData();
    const itemModel = data.getItemModel(dataIndex);
    const name = itemModel.get('name');
    if (name) {
      return name;
    }
    const fromName = itemModel.get('fromName');
    const toName = itemModel.get('toName');
    const nameArr = [];
    fromName != null && nameArr.push(fromName);
    toName != null && nameArr.push(toName);
    return createTooltipMarkup('nameValue', {
      name: nameArr.join(' > ')
    });
  }
  preventIncremental() {
    return !!this.get(['effect', 'show']);
  }
  getProgressive() {
    const progressive = this.option.progressive;
    if (progressive == null) {
      return this.option.large ? 1e4 : this.get('progressive');
    }
    return progressive;
  }
  getProgressiveThreshold() {
    const progressiveThreshold = this.option.progressiveThreshold;
    if (progressiveThreshold == null) {
      return this.option.large ? 2e4 : this.get('progressiveThreshold');
    }
    return progressiveThreshold;
  }
  getZLevelKey() {
    const effectModel = this.getModel('effect');
    const trailLength = effectModel.get('trailLength');
    return this.getData().count() > this.getProgressiveThreshold()
    // Each progressive series has individual key.
    ? this.id : effectModel.get('show') && trailLength > 0 ? trailLength + '' : '';
  }
}
LinesSeriesModel.type = 'series.lines';
LinesSeriesModel.dependencies = ['grid', 'polar', 'geo', 'calendar'];
LinesSeriesModel.defaultOption = {
  coordinateSystem: 'geo',
  // zlevel: 0,
  z: 2,
  legendHoverLink: true,
  // Cartesian coordinate system
  xAxisIndex: 0,
  yAxisIndex: 0,
  symbol: ['none', 'none'],
  symbolSize: [10, 10],
  // Geo coordinate system
  geoIndex: 0,
  effect: {
    show: false,
    period: 4,
    constantSpeed: 0,
    symbol: 'circle',
    symbolSize: 3,
    loop: true,
    trailLength: 0.2
  },
  large: false,
  // Available when large is true
  largeThreshold: 2000,
  polyline: false,
  clip: true,
  label: {
    show: false,
    position: 'end'
    // distance: 5,
    // formatter: 标签文本格式器，同Tooltip.formatter，不支持异步回调
  },

  lineStyle: {
    opacity: 0.5
  }
};
export default LinesSeriesModel;