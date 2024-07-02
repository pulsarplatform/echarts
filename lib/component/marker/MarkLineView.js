
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
import SeriesData from '../../data/SeriesData.js';
import * as numberUtil from '../../util/number.js';
import * as markerHelper from './markerHelper.js';
import LineDraw from '../../chart/helper/LineDraw.js';
import MarkerView from './MarkerView.js';
import { getStackedDimension } from '../../data/helper/dataStackHelper.js';
import { isCoordinateSystemType } from '../../coord/CoordinateSystem.js';
import { getECData } from '../../util/innerStore.js';
import MarkerModel from './MarkerModel.js';
import { isArray, retrieve, retrieve2, clone, extend, logError, merge, map, curry, filter, isNumber } from 'zrender/lib/core/util.js';
import { makeInner } from '../../util/model.js';
import { getVisualFromData } from '../../visual/helper.js';
const inner = makeInner();
const markLineTransform = function (seriesModel, coordSys, mlModel, item) {
  const data = seriesModel.getData();
  let itemArray;
  if (!isArray(item)) {
    // Special type markLine like 'min', 'max', 'average', 'median'
    const mlType = item.type;
    if (mlType === 'min' || mlType === 'max' || mlType === 'average' || mlType === 'median'
    // In case
    // data: [{
    //   yAxis: 10
    // }]
    || item.xAxis != null || item.yAxis != null) {
      let valueAxis;
      let value;
      if (item.yAxis != null || item.xAxis != null) {
        valueAxis = coordSys.getAxis(item.yAxis != null ? 'y' : 'x');
        value = retrieve(item.yAxis, item.xAxis);
      } else {
        const axisInfo = markerHelper.getAxisInfo(item, data, coordSys, seriesModel);
        valueAxis = axisInfo.valueAxis;
        const valueDataDim = getStackedDimension(data, axisInfo.valueDataDim);
        value = markerHelper.numCalculate(data, valueDataDim, mlType);
      }
      const valueIndex = valueAxis.dim === 'x' ? 0 : 1;
      const baseIndex = 1 - valueIndex;
      // Normized to 2d data with start and end point
      const mlFrom = clone(item);
      const mlTo = {
        coord: []
      };
      mlFrom.type = null;
      mlFrom.coord = [];
      mlFrom.coord[baseIndex] = -Infinity;
      mlTo.coord[baseIndex] = Infinity;
      const precision = mlModel.get('precision');
      if (precision >= 0 && isNumber(value)) {
        value = +value.toFixed(Math.min(precision, 20));
      }
      mlFrom.coord[valueIndex] = mlTo.coord[valueIndex] = value;
      itemArray = [mlFrom, mlTo, {
        type: mlType,
        valueIndex: item.valueIndex,
        // Force to use the value of calculated value.
        value: value
      }];
    } else {
      // Invalid data
      if (process.env.NODE_ENV !== 'production') {
        logError('Invalid markLine data.');
      }
      itemArray = [];
    }
  } else {
    itemArray = item;
  }
  const normalizedItem = [markerHelper.dataTransform(seriesModel, itemArray[0]), markerHelper.dataTransform(seriesModel, itemArray[1]), extend({}, itemArray[2])];
  // Avoid line data type is extended by from(to) data type
  normalizedItem[2].type = normalizedItem[2].type || null;
  // Merge from option and to option into line option
  merge(normalizedItem[2], normalizedItem[0]);
  merge(normalizedItem[2], normalizedItem[1]);
  return normalizedItem;
};
function isInfinity(val) {
  return !isNaN(val) && !isFinite(val);
}
// If a markLine has one dim
function ifMarkLineHasOnlyDim(dimIndex, fromCoord, toCoord, coordSys) {
  const otherDimIndex = 1 - dimIndex;
  const dimName = coordSys.dimensions[dimIndex];
  return isInfinity(fromCoord[otherDimIndex]) && isInfinity(toCoord[otherDimIndex]) && fromCoord[dimIndex] === toCoord[dimIndex] && coordSys.getAxis(dimName).containData(fromCoord[dimIndex]);
}
function markLineFilter(coordSys, item) {
  if (coordSys.type === 'cartesian2d') {
    const fromCoord = item[0].coord;
    const toCoord = item[1].coord;
    // In case
    // {
    //  markLine: {
    //    data: [{ yAxis: 2 }]
    //  }
    // }
    if (fromCoord && toCoord && (ifMarkLineHasOnlyDim(1, fromCoord, toCoord, coordSys) || ifMarkLineHasOnlyDim(0, fromCoord, toCoord, coordSys))) {
      return true;
    }
  }
  return markerHelper.dataFilter(coordSys, item[0]) && markerHelper.dataFilter(coordSys, item[1]);
}
function updateSingleMarkerEndLayout(data, idx, isFrom, seriesModel, api) {
  const coordSys = seriesModel.coordinateSystem;
  const itemModel = data.getItemModel(idx);
  let point;
  const xPx = numberUtil.parsePercent(itemModel.get('x'), api.getWidth());
  const yPx = numberUtil.parsePercent(itemModel.get('y'), api.getHeight());
  if (!isNaN(xPx) && !isNaN(yPx)) {
    point = [xPx, yPx];
  } else {
    // Chart like bar may have there own marker positioning logic
    if (seriesModel.getMarkerPosition) {
      // Use the getMarkerPosition
      point = seriesModel.getMarkerPosition(data.getValues(data.dimensions, idx));
    } else {
      const dims = coordSys.dimensions;
      const x = data.get(dims[0], idx);
      const y = data.get(dims[1], idx);
      point = coordSys.dataToPoint([x, y]);
    }
    // Expand line to the edge of grid if value on one axis is Inifnity
    // In case
    //  markLine: {
    //    data: [{
    //      yAxis: 2
    //      // or
    //      type: 'average'
    //    }]
    //  }
    if (isCoordinateSystemType(coordSys, 'cartesian2d')) {
      // TODO: TYPE ts@4.1 may still infer it as Axis instead of Axis2D. Not sure if it's a bug
      const xAxis = coordSys.getAxis('x');
      const yAxis = coordSys.getAxis('y');
      const dims = coordSys.dimensions;
      if (isInfinity(data.get(dims[0], idx))) {
        point[0] = xAxis.toGlobalCoord(xAxis.getExtent()[isFrom ? 0 : 1]);
      } else if (isInfinity(data.get(dims[1], idx))) {
        point[1] = yAxis.toGlobalCoord(yAxis.getExtent()[isFrom ? 0 : 1]);
      }
    }
    // Use x, y if has any
    if (!isNaN(xPx)) {
      point[0] = xPx;
    }
    if (!isNaN(yPx)) {
      point[1] = yPx;
    }
  }
  data.setItemLayout(idx, point);
}
class MarkLineView extends MarkerView {
  constructor() {
    super(...arguments);
    this.type = MarkLineView.type;
  }
  updateTransform(markLineModel, ecModel, api) {
    ecModel.eachSeries(function (seriesModel) {
      const mlModel = MarkerModel.getMarkerModelFromSeries(seriesModel, 'markLine');
      if (mlModel) {
        const mlData = mlModel.getData();
        const fromData = inner(mlModel).from;
        const toData = inner(mlModel).to;
        // Update visual and layout of from symbol and to symbol
        fromData.each(function (idx) {
          updateSingleMarkerEndLayout(fromData, idx, true, seriesModel, api);
          updateSingleMarkerEndLayout(toData, idx, false, seriesModel, api);
        });
        // Update layout of line
        mlData.each(function (idx) {
          mlData.setItemLayout(idx, [fromData.getItemLayout(idx), toData.getItemLayout(idx)]);
        });
        this.markerGroupMap.get(seriesModel.id).updateLayout();
      }
    }, this);
  }
  renderSeries(seriesModel, mlModel, ecModel, api) {
    const coordSys = seriesModel.coordinateSystem;
    const seriesId = seriesModel.id;
    const seriesData = seriesModel.getData();
    const lineDrawMap = this.markerGroupMap;
    const lineDraw = lineDrawMap.get(seriesId) || lineDrawMap.set(seriesId, new LineDraw());
    this.group.add(lineDraw.group);
    const mlData = createList(coordSys, seriesModel, mlModel);
    const fromData = mlData.from;
    const toData = mlData.to;
    const lineData = mlData.line;
    inner(mlModel).from = fromData;
    inner(mlModel).to = toData;
    // Line data for tooltip and formatter
    mlModel.setData(lineData);
    // TODO
    // Functionally, `symbolSize` & `symbolOffset` can also be 2D array now.
    // But the related logic and type definition are not finished yet.
    // Finish it if required
    let symbolType = mlModel.get('symbol');
    let symbolSize = mlModel.get('symbolSize');
    let symbolRotate = mlModel.get('symbolRotate');
    let symbolOffset = mlModel.get('symbolOffset');
    // TODO: support callback function like markPoint
    if (!isArray(symbolType)) {
      symbolType = [symbolType, symbolType];
    }
    if (!isArray(symbolSize)) {
      symbolSize = [symbolSize, symbolSize];
    }
    if (!isArray(symbolRotate)) {
      symbolRotate = [symbolRotate, symbolRotate];
    }
    if (!isArray(symbolOffset)) {
      symbolOffset = [symbolOffset, symbolOffset];
    }
    // Update visual and layout of from symbol and to symbol
    mlData.from.each(function (idx) {
      updateDataVisualAndLayout(fromData, idx, true);
      updateDataVisualAndLayout(toData, idx, false);
    });
    // Update visual and layout of line
    lineData.each(function (idx) {
      const lineStyle = lineData.getItemModel(idx).getModel('lineStyle').getLineStyle();
      // lineData.setItemVisual(idx, {
      //     color: lineColor || fromData.getItemVisual(idx, 'color')
      // });
      lineData.setItemLayout(idx, [fromData.getItemLayout(idx), toData.getItemLayout(idx)]);
      if (lineStyle.stroke == null) {
        lineStyle.stroke = fromData.getItemVisual(idx, 'style').fill;
      }
      lineData.setItemVisual(idx, {
        fromSymbolKeepAspect: fromData.getItemVisual(idx, 'symbolKeepAspect'),
        fromSymbolOffset: fromData.getItemVisual(idx, 'symbolOffset'),
        fromSymbolRotate: fromData.getItemVisual(idx, 'symbolRotate'),
        fromSymbolSize: fromData.getItemVisual(idx, 'symbolSize'),
        fromSymbol: fromData.getItemVisual(idx, 'symbol'),
        toSymbolKeepAspect: toData.getItemVisual(idx, 'symbolKeepAspect'),
        toSymbolOffset: toData.getItemVisual(idx, 'symbolOffset'),
        toSymbolRotate: toData.getItemVisual(idx, 'symbolRotate'),
        toSymbolSize: toData.getItemVisual(idx, 'symbolSize'),
        toSymbol: toData.getItemVisual(idx, 'symbol'),
        style: lineStyle
      });
    });
    lineDraw.updateData(lineData);
    // Set host model for tooltip
    // FIXME
    mlData.line.eachItemGraphicEl(function (el) {
      getECData(el).dataModel = mlModel;
      el.traverse(function (child) {
        getECData(child).dataModel = mlModel;
      });
    });
    function updateDataVisualAndLayout(data, idx, isFrom) {
      const itemModel = data.getItemModel(idx);
      updateSingleMarkerEndLayout(data, idx, isFrom, seriesModel, api);
      const style = itemModel.getModel('itemStyle').getItemStyle();
      if (style.fill == null) {
        style.fill = getVisualFromData(seriesData, 'color');
      }
      data.setItemVisual(idx, {
        symbolKeepAspect: itemModel.get('symbolKeepAspect'),
        // `0` should be considered as a valid value, so use `retrieve2` instead of `||`
        symbolOffset: retrieve2(itemModel.get('symbolOffset', true), symbolOffset[isFrom ? 0 : 1]),
        symbolRotate: retrieve2(itemModel.get('symbolRotate', true), symbolRotate[isFrom ? 0 : 1]),
        // TODO: when 2d array is supported, it should ignore parent
        symbolSize: retrieve2(itemModel.get('symbolSize'), symbolSize[isFrom ? 0 : 1]),
        symbol: retrieve2(itemModel.get('symbol', true), symbolType[isFrom ? 0 : 1]),
        style
      });
    }
    this.markKeep(lineDraw);
    lineDraw.group.silent = mlModel.get('silent') || seriesModel.get('silent');
  }
}
MarkLineView.type = 'markLine';
function createList(coordSys, seriesModel, mlModel) {
  let coordDimsInfos;
  if (coordSys) {
    coordDimsInfos = map(coordSys && coordSys.dimensions, function (coordDim) {
      const info = seriesModel.getData().getDimensionInfo(seriesModel.getData().mapDimension(coordDim)) || {};
      // In map series data don't have lng and lat dimension. Fallback to same with coordSys
      return extend(extend({}, info), {
        name: coordDim,
        // DON'T use ordinalMeta to parse and collect ordinal.
        ordinalMeta: null
      });
    });
  } else {
    coordDimsInfos = [{
      name: 'value',
      type: 'float'
    }];
  }
  const fromData = new SeriesData(coordDimsInfos, mlModel);
  const toData = new SeriesData(coordDimsInfos, mlModel);
  // No dimensions
  const lineData = new SeriesData([], mlModel);
  let optData = map(mlModel.get('data'), curry(markLineTransform, seriesModel, coordSys, mlModel));
  if (coordSys) {
    optData = filter(optData, curry(markLineFilter, coordSys));
  }
  const dimValueGetter = markerHelper.createMarkerDimValueGetter(!!coordSys, coordDimsInfos);
  fromData.initData(map(optData, function (item) {
    return item[0];
  }), null, dimValueGetter);
  toData.initData(map(optData, function (item) {
    return item[1];
  }), null, dimValueGetter);
  lineData.initData(map(optData, function (item) {
    return item[2];
  }));
  lineData.hasItemOption = true;
  return {
    from: fromData,
    to: toData,
    line: lineData
  };
}
export default MarkLineView;