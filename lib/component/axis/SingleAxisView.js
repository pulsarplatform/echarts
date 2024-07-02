
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
import * as graphic from '../../util/graphic.js';
import * as singleAxisHelper from '../../coord/single/singleAxisHelper.js';
import AxisView from './AxisView.js';
import { rectCoordAxisBuildSplitArea, rectCoordAxisHandleRemove } from './axisSplitHelper.js';
const axisBuilderAttrs = ['axisLine', 'axisTickLabel', 'axisName'];
const selfBuilderAttrs = ['splitArea', 'splitLine'];
class SingleAxisView extends AxisView {
  constructor() {
    super(...arguments);
    this.type = SingleAxisView.type;
    this.axisPointerClass = 'SingleAxisPointer';
  }
  render(axisModel, ecModel, api, payload) {
    const group = this.group;
    group.removeAll();
    const oldAxisGroup = this._axisGroup;
    this._axisGroup = new graphic.Group();
    const layout = singleAxisHelper.layout(axisModel);
    const axisBuilder = new AxisBuilder(axisModel, layout);
    zrUtil.each(axisBuilderAttrs, axisBuilder.add, axisBuilder);
    group.add(this._axisGroup);
    group.add(axisBuilder.getGroup());
    zrUtil.each(selfBuilderAttrs, function (name) {
      if (axisModel.get([name, 'show'])) {
        axisElementBuilders[name](this, this.group, this._axisGroup, axisModel);
      }
    }, this);
    graphic.groupTransition(oldAxisGroup, this._axisGroup, axisModel);
    super.render(axisModel, ecModel, api, payload);
  }
  remove() {
    rectCoordAxisHandleRemove(this);
  }
}
SingleAxisView.type = 'singleAxis';
const axisElementBuilders = {
  splitLine(axisView, group, axisGroup, axisModel) {
    const axis = axisModel.axis;
    if (axis.scale.isBlank()) {
      return;
    }
    const splitLineModel = axisModel.getModel('splitLine');
    const lineStyleModel = splitLineModel.getModel('lineStyle');
    let lineColors = lineStyleModel.get('color');
    lineColors = lineColors instanceof Array ? lineColors : [lineColors];
    const lineWidth = lineStyleModel.get('width');
    const gridRect = axisModel.coordinateSystem.getRect();
    const isHorizontal = axis.isHorizontal();
    const splitLines = [];
    let lineCount = 0;
    const ticksCoords = axis.getTicksCoords({
      tickModel: splitLineModel
    });
    const p1 = [];
    const p2 = [];
    for (let i = 0; i < ticksCoords.length; ++i) {
      const tickCoord = axis.toGlobalCoord(ticksCoords[i].coord);
      if (isHorizontal) {
        p1[0] = tickCoord;
        p1[1] = gridRect.y;
        p2[0] = tickCoord;
        p2[1] = gridRect.y + gridRect.height;
      } else {
        p1[0] = gridRect.x;
        p1[1] = tickCoord;
        p2[0] = gridRect.x + gridRect.width;
        p2[1] = tickCoord;
      }
      const line = new graphic.Line({
        shape: {
          x1: p1[0],
          y1: p1[1],
          x2: p2[0],
          y2: p2[1]
        },
        silent: true
      });
      graphic.subPixelOptimizeLine(line.shape, lineWidth);
      const colorIndex = lineCount++ % lineColors.length;
      splitLines[colorIndex] = splitLines[colorIndex] || [];
      splitLines[colorIndex].push(line);
    }
    const lineStyle = lineStyleModel.getLineStyle(['color']);
    for (let i = 0; i < splitLines.length; ++i) {
      group.add(graphic.mergePath(splitLines[i], {
        style: zrUtil.defaults({
          stroke: lineColors[i % lineColors.length]
        }, lineStyle),
        silent: true
      }));
    }
  },
  splitArea(axisView, group, axisGroup, axisModel) {
    rectCoordAxisBuildSplitArea(axisView, axisGroup, axisModel, axisModel);
  }
};
export default SingleAxisView;