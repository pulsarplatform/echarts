
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
// TODO Axis scale
import * as zrUtil from 'zrender/lib/core/util.js';
import Polar, { polarDimensions } from './Polar.js';
import { parsePercent } from '../../util/number.js';
import { createScaleByModel, niceScaleExtent, getDataDimensionsOnAxis } from '../../coord/axisHelper.js';
import { SINGLE_REFERRING } from '../../util/model.js';
/**
 * Resize method bound to the polar
 */
function resizePolar(polar, polarModel, api) {
  const center = polarModel.get('center');
  const width = api.getWidth();
  const height = api.getHeight();
  polar.cx = parsePercent(center[0], width);
  polar.cy = parsePercent(center[1], height);
  const radiusAxis = polar.getRadiusAxis();
  const size = Math.min(width, height) / 2;
  let radius = polarModel.get('radius');
  if (radius == null) {
    radius = [0, '100%'];
  } else if (!zrUtil.isArray(radius)) {
    // r0 = 0
    radius = [0, radius];
  }
  const parsedRadius = [parsePercent(radius[0], size), parsePercent(radius[1], size)];
  radiusAxis.inverse ? radiusAxis.setExtent(parsedRadius[1], parsedRadius[0]) : radiusAxis.setExtent(parsedRadius[0], parsedRadius[1]);
}
/**
 * Update polar
 */
function updatePolarScale(ecModel, api) {
  const polar = this;
  const angleAxis = polar.getAngleAxis();
  const radiusAxis = polar.getRadiusAxis();
  // Reset scale
  angleAxis.scale.setExtent(Infinity, -Infinity);
  radiusAxis.scale.setExtent(Infinity, -Infinity);
  ecModel.eachSeries(function (seriesModel) {
    if (seriesModel.coordinateSystem === polar) {
      const data = seriesModel.getData();
      zrUtil.each(getDataDimensionsOnAxis(data, 'radius'), function (dim) {
        radiusAxis.scale.unionExtentFromData(data, dim);
      });
      zrUtil.each(getDataDimensionsOnAxis(data, 'angle'), function (dim) {
        angleAxis.scale.unionExtentFromData(data, dim);
      });
    }
  });
  niceScaleExtent(angleAxis.scale, angleAxis.model);
  niceScaleExtent(radiusAxis.scale, radiusAxis.model);
  // Fix extent of category angle axis
  if (angleAxis.type === 'category' && !angleAxis.onBand) {
    const extent = angleAxis.getExtent();
    const diff = 360 / angleAxis.scale.count();
    angleAxis.inverse ? extent[1] += diff : extent[1] -= diff;
    angleAxis.setExtent(extent[0], extent[1]);
  }
}
function isAngleAxisModel(axisModel) {
  return axisModel.mainType === 'angleAxis';
}
/**
 * Set common axis properties
 */
function setAxis(axis, axisModel) {
  var _a;
  axis.type = axisModel.get('type');
  axis.scale = createScaleByModel(axisModel);
  axis.onBand = axisModel.get('boundaryGap') && axis.type === 'category';
  axis.inverse = axisModel.get('inverse');
  if (isAngleAxisModel(axisModel)) {
    axis.inverse = axis.inverse !== axisModel.get('clockwise');
    const startAngle = axisModel.get('startAngle');
    const endAngle = (_a = axisModel.get('endAngle')) !== null && _a !== void 0 ? _a : startAngle + (axis.inverse ? -360 : 360);
    axis.setExtent(startAngle, endAngle);
  }
  // Inject axis instance
  axisModel.axis = axis;
  axis.model = axisModel;
}
const polarCreator = {
  dimensions: polarDimensions,
  create: function (ecModel, api) {
    const polarList = [];
    ecModel.eachComponent('polar', function (polarModel, idx) {
      const polar = new Polar(idx + '');
      // Inject resize and update method
      polar.update = updatePolarScale;
      const radiusAxis = polar.getRadiusAxis();
      const angleAxis = polar.getAngleAxis();
      const radiusAxisModel = polarModel.findAxisModel('radiusAxis');
      const angleAxisModel = polarModel.findAxisModel('angleAxis');
      setAxis(radiusAxis, radiusAxisModel);
      setAxis(angleAxis, angleAxisModel);
      resizePolar(polar, polarModel, api);
      polarList.push(polar);
      polarModel.coordinateSystem = polar;
      polar.model = polarModel;
    });
    // Inject coordinateSystem to series
    ecModel.eachSeries(function (seriesModel) {
      if (seriesModel.get('coordinateSystem') === 'polar') {
        const polarModel = seriesModel.getReferringComponents('polar', SINGLE_REFERRING).models[0];
        if (process.env.NODE_ENV !== 'production') {
          if (!polarModel) {
            throw new Error('Polar "' + zrUtil.retrieve(seriesModel.get('polarIndex'), seriesModel.get('polarId'), 0) + '" not found');
          }
        }
        seriesModel.coordinateSystem = polarModel.coordinateSystem;
      }
    });
    return polarList;
  }
};
export default polarCreator;