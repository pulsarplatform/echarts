
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
import * as graphic from '../../util/graphic.js';
import { toggleHoverEmphasis } from '../../util/states.js';
import HeatmapLayer from './HeatmapLayer.js';
import * as zrUtil from 'zrender/lib/core/util.js';
import ChartView from '../../view/Chart.js';
import { isCoordinateSystemType } from '../../coord/CoordinateSystem.js';
import { setLabelStyle, getLabelStatesModels } from '../../label/labelStyle.js';
function getIsInPiecewiseRange(dataExtent, pieceList, selected) {
  const dataSpan = dataExtent[1] - dataExtent[0];
  pieceList = zrUtil.map(pieceList, function (piece) {
    return {
      interval: [(piece.interval[0] - dataExtent[0]) / dataSpan, (piece.interval[1] - dataExtent[0]) / dataSpan]
    };
  });
  const len = pieceList.length;
  let lastIndex = 0;
  return function (val) {
    let i;
    // Try to find in the location of the last found
    for (i = lastIndex; i < len; i++) {
      const interval = pieceList[i].interval;
      if (interval[0] <= val && val <= interval[1]) {
        lastIndex = i;
        break;
      }
    }
    if (i === len) {
      // Not found, back interation
      for (i = lastIndex - 1; i >= 0; i--) {
        const interval = pieceList[i].interval;
        if (interval[0] <= val && val <= interval[1]) {
          lastIndex = i;
          break;
        }
      }
    }
    return i >= 0 && i < len && selected[i];
  };
}
function getIsInContinuousRange(dataExtent, range) {
  const dataSpan = dataExtent[1] - dataExtent[0];
  range = [(range[0] - dataExtent[0]) / dataSpan, (range[1] - dataExtent[0]) / dataSpan];
  return function (val) {
    return val >= range[0] && val <= range[1];
  };
}
function isGeoCoordSys(coordSys) {
  const dimensions = coordSys.dimensions;
  // Not use coordSys.type === 'geo' because coordSys maybe extended
  return dimensions[0] === 'lng' && dimensions[1] === 'lat';
}
class HeatmapView extends ChartView {
  constructor() {
    super(...arguments);
    this.type = HeatmapView.type;
  }
  render(seriesModel, ecModel, api) {
    let visualMapOfThisSeries;
    ecModel.eachComponent('visualMap', function (visualMap) {
      visualMap.eachTargetSeries(function (targetSeries) {
        if (targetSeries === seriesModel) {
          visualMapOfThisSeries = visualMap;
        }
      });
    });
    if (process.env.NODE_ENV !== 'production') {
      if (!visualMapOfThisSeries) {
        throw new Error('Heatmap must use with visualMap');
      }
    }
    // Clear previously rendered progressive elements.
    this._progressiveEls = null;
    this.group.removeAll();
    const coordSys = seriesModel.coordinateSystem;
    if (coordSys.type === 'cartesian2d' || coordSys.type === 'calendar') {
      this._renderOnCartesianAndCalendar(seriesModel, api, 0, seriesModel.getData().count());
    } else if (isGeoCoordSys(coordSys)) {
      this._renderOnGeo(coordSys, seriesModel, visualMapOfThisSeries, api);
    }
  }
  incrementalPrepareRender(seriesModel, ecModel, api) {
    this.group.removeAll();
  }
  incrementalRender(params, seriesModel, ecModel, api) {
    const coordSys = seriesModel.coordinateSystem;
    if (coordSys) {
      // geo does not support incremental rendering?
      if (isGeoCoordSys(coordSys)) {
        this.render(seriesModel, ecModel, api);
      } else {
        this._progressiveEls = [];
        this._renderOnCartesianAndCalendar(seriesModel, api, params.start, params.end, true);
      }
    }
  }
  eachRendered(cb) {
    graphic.traverseElements(this._progressiveEls || this.group, cb);
  }
  _renderOnCartesianAndCalendar(seriesModel, api, start, end, incremental) {
    const coordSys = seriesModel.coordinateSystem;
    const isCartesian2d = isCoordinateSystemType(coordSys, 'cartesian2d');
    let width;
    let height;
    let xAxisExtent;
    let yAxisExtent;
    if (isCartesian2d) {
      const xAxis = coordSys.getAxis('x');
      const yAxis = coordSys.getAxis('y');
      if (process.env.NODE_ENV !== 'production') {
        if (!(xAxis.type === 'category' && yAxis.type === 'category')) {
          throw new Error('Heatmap on cartesian must have two category axes');
        }
        if (!(xAxis.onBand && yAxis.onBand)) {
          throw new Error('Heatmap on cartesian must have two axes with boundaryGap true');
        }
      }
      // add 0.5px to avoid the gaps
      width = xAxis.getBandWidth() + .5;
      height = yAxis.getBandWidth() + .5;
      xAxisExtent = xAxis.scale.getExtent();
      yAxisExtent = yAxis.scale.getExtent();
    }
    const group = this.group;
    const data = seriesModel.getData();
    let emphasisStyle = seriesModel.getModel(['emphasis', 'itemStyle']).getItemStyle();
    let blurStyle = seriesModel.getModel(['blur', 'itemStyle']).getItemStyle();
    let selectStyle = seriesModel.getModel(['select', 'itemStyle']).getItemStyle();
    let borderRadius = seriesModel.get(['itemStyle', 'borderRadius']);
    let labelStatesModels = getLabelStatesModels(seriesModel);
    const emphasisModel = seriesModel.getModel('emphasis');
    let focus = emphasisModel.get('focus');
    let blurScope = emphasisModel.get('blurScope');
    let emphasisDisabled = emphasisModel.get('disabled');
    const dataDims = isCartesian2d ? [data.mapDimension('x'), data.mapDimension('y'), data.mapDimension('value')] : [data.mapDimension('time'), data.mapDimension('value')];
    for (let idx = start; idx < end; idx++) {
      let rect;
      const style = data.getItemVisual(idx, 'style');
      if (isCartesian2d) {
        const dataDimX = data.get(dataDims[0], idx);
        const dataDimY = data.get(dataDims[1], idx);
        // Ignore empty data and out of extent data
        if (isNaN(data.get(dataDims[2], idx)) || isNaN(dataDimX) || isNaN(dataDimY) || dataDimX < xAxisExtent[0] || dataDimX > xAxisExtent[1] || dataDimY < yAxisExtent[0] || dataDimY > yAxisExtent[1]) {
          continue;
        }
        const point = coordSys.dataToPoint([dataDimX, dataDimY]);
        rect = new graphic.Rect({
          shape: {
            x: point[0] - width / 2,
            y: point[1] - height / 2,
            width,
            height
          },
          style
        });
      } else {
        // Ignore empty data
        if (isNaN(data.get(dataDims[1], idx))) {
          continue;
        }
        rect = new graphic.Rect({
          z2: 1,
          shape: coordSys.dataToRect([data.get(dataDims[0], idx)]).contentShape,
          style
        });
      }
      // Optimization for large dataset
      if (data.hasItemOption) {
        const itemModel = data.getItemModel(idx);
        const emphasisModel = itemModel.getModel('emphasis');
        emphasisStyle = emphasisModel.getModel('itemStyle').getItemStyle();
        blurStyle = itemModel.getModel(['blur', 'itemStyle']).getItemStyle();
        selectStyle = itemModel.getModel(['select', 'itemStyle']).getItemStyle();
        // Each item value struct in the data would be firstly
        // {
        //     itemStyle: { borderRadius: [30, 30] },
        //     value: [2022, 02, 22]
        // }
        borderRadius = itemModel.get(['itemStyle', 'borderRadius']);
        focus = emphasisModel.get('focus');
        blurScope = emphasisModel.get('blurScope');
        emphasisDisabled = emphasisModel.get('disabled');
        labelStatesModels = getLabelStatesModels(itemModel);
      }
      rect.shape.r = borderRadius;
      const rawValue = seriesModel.getRawValue(idx);
      let defaultText = '-';
      if (rawValue && rawValue[2] != null) {
        defaultText = rawValue[2] + '';
      }
      setLabelStyle(rect, labelStatesModels, {
        labelFetcher: seriesModel,
        labelDataIndex: idx,
        defaultOpacity: style.opacity,
        defaultText: defaultText
      });
      rect.ensureState('emphasis').style = emphasisStyle;
      rect.ensureState('blur').style = blurStyle;
      rect.ensureState('select').style = selectStyle;
      toggleHoverEmphasis(rect, focus, blurScope, emphasisDisabled);
      rect.incremental = incremental;
      // PENDING
      if (incremental) {
        // Rect must use hover layer if it's incremental.
        rect.states.emphasis.hoverLayer = true;
      }
      group.add(rect);
      data.setItemGraphicEl(idx, rect);
      if (this._progressiveEls) {
        this._progressiveEls.push(rect);
      }
    }
  }
  _renderOnGeo(geo, seriesModel, visualMapModel, api) {
    const inRangeVisuals = visualMapModel.targetVisuals.inRange;
    const outOfRangeVisuals = visualMapModel.targetVisuals.outOfRange;
    // if (!visualMapping) {
    //     throw new Error('Data range must have color visuals');
    // }
    const data = seriesModel.getData();
    const hmLayer = this._hmLayer || this._hmLayer || new HeatmapLayer();
    hmLayer.blurSize = seriesModel.get('blurSize');
    hmLayer.pointSize = seriesModel.get('pointSize');
    hmLayer.minOpacity = seriesModel.get('minOpacity');
    hmLayer.maxOpacity = seriesModel.get('maxOpacity');
    const rect = geo.getViewRect().clone();
    const roamTransform = geo.getRoamTransform();
    rect.applyTransform(roamTransform);
    // Clamp on viewport
    const x = Math.max(rect.x, 0);
    const y = Math.max(rect.y, 0);
    const x2 = Math.min(rect.width + rect.x, api.getWidth());
    const y2 = Math.min(rect.height + rect.y, api.getHeight());
    const width = x2 - x;
    const height = y2 - y;
    const dims = [data.mapDimension('lng'), data.mapDimension('lat'), data.mapDimension('value')];
    const points = data.mapArray(dims, function (lng, lat, value) {
      const pt = geo.dataToPoint([lng, lat]);
      pt[0] -= x;
      pt[1] -= y;
      pt.push(value);
      return pt;
    });
    const dataExtent = visualMapModel.getExtent();
    const isInRange = visualMapModel.type === 'visualMap.continuous' ? getIsInContinuousRange(dataExtent, visualMapModel.option.range) : getIsInPiecewiseRange(dataExtent, visualMapModel.getPieceList(), visualMapModel.option.selected);
    hmLayer.update(points, width, height, inRangeVisuals.color.getNormalizer(), {
      inRange: inRangeVisuals.color.getColorMapper(),
      outOfRange: outOfRangeVisuals.color.getColorMapper()
    }, isInRange);
    const img = new graphic.Image({
      style: {
        width: width,
        height: height,
        x: x,
        y: y,
        image: hmLayer.canvas
      },
      silent: true
    });
    this.group.add(img);
  }
}
HeatmapView.type = 'heatmap';
export default HeatmapView;