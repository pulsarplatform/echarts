
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
import ComponentModel from '../../model/Component.js';
class ParallelModel extends ComponentModel {
  constructor() {
    super(...arguments);
    this.type = ParallelModel.type;
  }
  init() {
    super.init.apply(this, arguments);
    this.mergeOption({});
  }
  mergeOption(newOption) {
    const thisOption = this.option;
    newOption && zrUtil.merge(thisOption, newOption, true);
    this._initDimensions();
  }
  /**
   * Whether series or axis is in this coordinate system.
   */
  contains(model, ecModel) {
    const parallelIndex = model.get('parallelIndex');
    return parallelIndex != null && ecModel.getComponent('parallel', parallelIndex) === this;
  }
  setAxisExpand(opt) {
    zrUtil.each(['axisExpandable', 'axisExpandCenter', 'axisExpandCount', 'axisExpandWidth', 'axisExpandWindow'], function (name) {
      if (opt.hasOwnProperty(name)) {
        // @ts-ignore FIXME: why "never" inferred in this.option[name]?
        this.option[name] = opt[name];
      }
    }, this);
  }
  _initDimensions() {
    const dimensions = this.dimensions = [];
    const parallelAxisIndex = this.parallelAxisIndex = [];
    const axisModels = zrUtil.filter(this.ecModel.queryComponents({
      mainType: 'parallelAxis'
    }), function (axisModel) {
      // Can not use this.contains here, because
      // initialization has not been completed yet.
      return (axisModel.get('parallelIndex') || 0) === this.componentIndex;
    }, this);
    zrUtil.each(axisModels, function (axisModel) {
      dimensions.push('dim' + axisModel.get('dim'));
      parallelAxisIndex.push(axisModel.componentIndex);
    });
  }
}
ParallelModel.type = 'parallel';
ParallelModel.dependencies = ['parallelAxis'];
ParallelModel.layoutMode = 'box';
ParallelModel.defaultOption = {
  // zlevel: 0,
  z: 0,
  left: 80,
  top: 60,
  right: 80,
  bottom: 60,
  // width: {totalWidth} - left - right,
  // height: {totalHeight} - top - bottom,
  layout: 'horizontal',
  // FIXME
  // naming?
  axisExpandable: false,
  axisExpandCenter: null,
  axisExpandCount: 0,
  axisExpandWidth: 50,
  axisExpandRate: 17,
  axisExpandDebounce: 50,
  // [out, in, jumpTarget]. In percentage. If use [null, 0.05], null means full.
  // Do not doc to user until necessary.
  axisExpandSlideTriggerArea: [-0.15, 0.05, 0.4],
  axisExpandTriggerOn: 'click',
  parallelAxisDefault: null
};
export default ParallelModel;