
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
import BoundingRect from 'zrender/lib/core/BoundingRect.js';
import Cartesian from './Cartesian.js';
import { invert } from 'zrender/lib/core/matrix.js';
import { applyTransform } from 'zrender/lib/core/vector.js';
export const cartesian2DDimensions = ['x', 'y'];
function canCalculateAffineTransform(scale) {
  return scale.type === 'interval' || scale.type === 'time';
}
class Cartesian2D extends Cartesian {
  constructor() {
    super(...arguments);
    this.type = 'cartesian2d';
    this.dimensions = cartesian2DDimensions;
  }
  /**
   * Calculate an affine transform matrix if two axes are time or value.
   * It's mainly for accelartion on the large time series data.
   */
  calcAffineTransform() {
    this._transform = this._invTransform = null;
    const xAxisScale = this.getAxis('x').scale;
    const yAxisScale = this.getAxis('y').scale;
    if (!canCalculateAffineTransform(xAxisScale) || !canCalculateAffineTransform(yAxisScale)) {
      return;
    }
    const xScaleExtent = xAxisScale.getExtent();
    const yScaleExtent = yAxisScale.getExtent();
    const start = this.dataToPoint([xScaleExtent[0], yScaleExtent[0]]);
    const end = this.dataToPoint([xScaleExtent[1], yScaleExtent[1]]);
    const xScaleSpan = xScaleExtent[1] - xScaleExtent[0];
    const yScaleSpan = yScaleExtent[1] - yScaleExtent[0];
    if (!xScaleSpan || !yScaleSpan) {
      return;
    }
    // Accelerate data to point calculation on the special large time series data.
    const scaleX = (end[0] - start[0]) / xScaleSpan;
    const scaleY = (end[1] - start[1]) / yScaleSpan;
    const translateX = start[0] - xScaleExtent[0] * scaleX;
    const translateY = start[1] - yScaleExtent[0] * scaleY;
    const m = this._transform = [scaleX, 0, 0, scaleY, translateX, translateY];
    this._invTransform = invert([], m);
  }
  /**
   * Base axis will be used on stacking.
   */
  getBaseAxis() {
    return this.getAxesByScale('ordinal')[0] || this.getAxesByScale('time')[0] || this.getAxis('x');
  }
  containPoint(point) {
    const axisX = this.getAxis('x');
    const axisY = this.getAxis('y');
    return axisX.contain(axisX.toLocalCoord(point[0])) && axisY.contain(axisY.toLocalCoord(point[1]));
  }
  containData(data) {
    return this.getAxis('x').containData(data[0]) && this.getAxis('y').containData(data[1]);
  }
  containZone(data1, data2) {
    const zoneDiag1 = this.dataToPoint(data1);
    const zoneDiag2 = this.dataToPoint(data2);
    const area = this.getArea();
    const zone = new BoundingRect(zoneDiag1[0], zoneDiag1[1], zoneDiag2[0] - zoneDiag1[0], zoneDiag2[1] - zoneDiag1[1]);
    return area.intersect(zone);
  }
  dataToPoint(data, clamp, out) {
    out = out || [];
    const xVal = data[0];
    const yVal = data[1];
    // Fast path
    if (this._transform
    // It's supported that if data is like `[Inifity, 123]`, where only Y pixel calculated.
    && xVal != null && isFinite(xVal) && yVal != null && isFinite(yVal)) {
      return applyTransform(out, data, this._transform);
    }
    const xAxis = this.getAxis('x');
    const yAxis = this.getAxis('y');
    out[0] = xAxis.toGlobalCoord(xAxis.dataToCoord(xVal, clamp));
    out[1] = yAxis.toGlobalCoord(yAxis.dataToCoord(yVal, clamp));
    return out;
  }
  clampData(data, out) {
    const xScale = this.getAxis('x').scale;
    const yScale = this.getAxis('y').scale;
    const xAxisExtent = xScale.getExtent();
    const yAxisExtent = yScale.getExtent();
    const x = xScale.parse(data[0]);
    const y = yScale.parse(data[1]);
    out = out || [];
    out[0] = Math.min(Math.max(Math.min(xAxisExtent[0], xAxisExtent[1]), x), Math.max(xAxisExtent[0], xAxisExtent[1]));
    out[1] = Math.min(Math.max(Math.min(yAxisExtent[0], yAxisExtent[1]), y), Math.max(yAxisExtent[0], yAxisExtent[1]));
    return out;
  }
  pointToData(point, clamp) {
    const out = [];
    if (this._invTransform) {
      return applyTransform(out, point, this._invTransform);
    }
    const xAxis = this.getAxis('x');
    const yAxis = this.getAxis('y');
    out[0] = xAxis.coordToData(xAxis.toLocalCoord(point[0]), clamp);
    out[1] = yAxis.coordToData(yAxis.toLocalCoord(point[1]), clamp);
    return out;
  }
  getOtherAxis(axis) {
    return this.getAxis(axis.dim === 'x' ? 'y' : 'x');
  }
  /**
   * Get rect area of cartesian.
   * Area will have a contain function to determine if a point is in the coordinate system.
   */
  getArea(tolerance) {
    tolerance = tolerance || 0;
    const xExtent = this.getAxis('x').getGlobalExtent();
    const yExtent = this.getAxis('y').getGlobalExtent();
    const x = Math.min(xExtent[0], xExtent[1]) - tolerance;
    const y = Math.min(yExtent[0], yExtent[1]) - tolerance;
    const width = Math.max(xExtent[0], xExtent[1]) - x + tolerance;
    const height = Math.max(yExtent[0], yExtent[1]) - y + tolerance;
    return new BoundingRect(x, y, width, height);
  }
}
;
export default Cartesian2D;