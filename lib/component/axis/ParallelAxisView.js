
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
import * as zrUtil from 'zrender/lib/core/util.js';
import AxisBuilder from './AxisBuilder.js';
import BrushController from '../helper/BrushController.js';
import * as brushHelper from '../helper/brushHelper.js';
import * as graphic from '../../util/graphic.js';
import ComponentView from '../../view/Component.js';
const elementList = ['axisLine', 'axisTickLabel', 'axisName'];
class ParallelAxisView extends ComponentView {
  constructor() {
    super(...arguments);
    this.type = ParallelAxisView.type;
  }
  init(ecModel, api) {
    super.init.apply(this, arguments);
    (this._brushController = new BrushController(api.getZr())).on('brush', zrUtil.bind(this._onBrush, this));
  }
  render(axisModel, ecModel, api, payload) {
    if (fromAxisAreaSelect(axisModel, ecModel, payload)) {
      return;
    }
    this.axisModel = axisModel;
    this.api = api;
    this.group.removeAll();
    const oldAxisGroup = this._axisGroup;
    this._axisGroup = new graphic.Group();
    this.group.add(this._axisGroup);
    if (!axisModel.get('show')) {
      return;
    }
    const coordSysModel = getCoordSysModel(axisModel, ecModel);
    const coordSys = coordSysModel.coordinateSystem;
    const areaSelectStyle = axisModel.getAreaSelectStyle();
    const areaWidth = areaSelectStyle.width;
    const dim = axisModel.axis.dim;
    const axisLayout = coordSys.getAxisLayout(dim);
    const builderOpt = zrUtil.extend({
      strokeContainThreshold: areaWidth
    }, axisLayout);
    const axisBuilder = new AxisBuilder(axisModel, builderOpt);
    zrUtil.each(elementList, axisBuilder.add, axisBuilder);
    this._axisGroup.add(axisBuilder.getGroup());
    this._refreshBrushController(builderOpt, areaSelectStyle, axisModel, coordSysModel, areaWidth, api);
    graphic.groupTransition(oldAxisGroup, this._axisGroup, axisModel);
  }
  // /**
  //  * @override
  //  */
  // updateVisual(axisModel, ecModel, api, payload) {
  //     this._brushController && this._brushController
  //         .updateCovers(getCoverInfoList(axisModel));
  // }
  _refreshBrushController(builderOpt, areaSelectStyle, axisModel, coordSysModel, areaWidth, api) {
    // After filtering, axis may change, select area needs to be update.
    const extent = axisModel.axis.getExtent();
    const extentLen = extent[1] - extent[0];
    const extra = Math.min(30, Math.abs(extentLen) * 0.1); // Arbitrary value.
    // width/height might be negative, which will be
    // normalized in BoundingRect.
    const rect = graphic.BoundingRect.create({
      x: extent[0],
      y: -areaWidth / 2,
      width: extentLen,
      height: areaWidth
    });
    rect.x -= extra;
    rect.width += 2 * extra;
    this._brushController.mount({
      enableGlobalPan: true,
      rotation: builderOpt.rotation,
      x: builderOpt.position[0],
      y: builderOpt.position[1]
    }).setPanels([{
      panelId: 'pl',
      clipPath: brushHelper.makeRectPanelClipPath(rect),
      isTargetByCursor: brushHelper.makeRectIsTargetByCursor(rect, api, coordSysModel),
      getLinearBrushOtherExtent: brushHelper.makeLinearBrushOtherExtent(rect, 0)
    }]).enableBrush({
      brushType: 'lineX',
      brushStyle: areaSelectStyle,
      removeOnClick: true
    }).updateCovers(getCoverInfoList(axisModel));
  }
  _onBrush(eventParam) {
    const coverInfoList = eventParam.areas;
    // Do not cache these object, because the mey be changed.
    const axisModel = this.axisModel;
    const axis = axisModel.axis;
    const intervals = zrUtil.map(coverInfoList, function (coverInfo) {
      return [axis.coordToData(coverInfo.range[0], true), axis.coordToData(coverInfo.range[1], true)];
    });
    // If realtime is true, action is not dispatched on drag end, because
    // the drag end emits the same params with the last drag move event,
    // and may have some delay when using touch pad.
    if (!axisModel.option.realtime === eventParam.isEnd || eventParam.removeOnClick) {
      // jshint ignore:line
      this.api.dispatchAction({
        type: 'axisAreaSelect',
        parallelAxisId: axisModel.id,
        intervals: intervals
      });
    }
  }
  dispose() {
    this._brushController.dispose();
  }
}
ParallelAxisView.type = 'parallelAxis';
function fromAxisAreaSelect(axisModel, ecModel, payload) {
  return payload && payload.type === 'axisAreaSelect' && ecModel.findComponents({
    mainType: 'parallelAxis',
    query: payload
  })[0] === axisModel;
}
function getCoverInfoList(axisModel) {
  const axis = axisModel.axis;
  return zrUtil.map(axisModel.activeIntervals, function (interval) {
    return {
      brushType: 'lineX',
      panelId: 'pl',
      range: [axis.dataToCoord(interval[0], true), axis.dataToCoord(interval[1], true)]
    };
  });
}
function getCoordSysModel(axisModel, ecModel) {
  return ecModel.getComponent('parallel', axisModel.get('parallelIndex'));
}
export default ParallelAxisView;