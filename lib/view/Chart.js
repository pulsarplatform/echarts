
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
import { each } from 'zrender/lib/core/util.js';
import Group from 'zrender/lib/graphic/Group.js';
import * as componentUtil from '../util/component.js';
import * as clazzUtil from '../util/clazz.js';
import * as modelUtil from '../util/model.js';
import { enterEmphasis, leaveEmphasis, getHighlightDigit, isHighDownDispatcher } from '../util/states.js';
import { createTask } from '../core/task.js';
import createRenderPlanner from '../chart/helper/createRenderPlanner.js';
import { traverseElements } from '../util/graphic.js';
import { error } from '../util/log.js';
const inner = modelUtil.makeInner();
const renderPlanner = createRenderPlanner();
class ChartView {
  constructor() {
    this.group = new Group();
    this.uid = componentUtil.getUID('viewChart');
    this.renderTask = createTask({
      plan: renderTaskPlan,
      reset: renderTaskReset
    });
    this.renderTask.context = {
      view: this
    };
  }
  init(ecModel, api) {}
  render(seriesModel, ecModel, api, payload) {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error('render method must been implemented');
    }
  }
  /**
   * Highlight series or specified data item.
   */
  highlight(seriesModel, ecModel, api, payload) {
    const data = seriesModel.getData(payload && payload.dataType);
    if (!data) {
      if (process.env.NODE_ENV !== 'production') {
        error(`Unknown dataType ${payload.dataType}`);
      }
      return;
    }
    toggleHighlight(data, payload, 'emphasis');
  }
  /**
   * Downplay series or specified data item.
   */
  downplay(seriesModel, ecModel, api, payload) {
    const data = seriesModel.getData(payload && payload.dataType);
    if (!data) {
      if (process.env.NODE_ENV !== 'production') {
        error(`Unknown dataType ${payload.dataType}`);
      }
      return;
    }
    toggleHighlight(data, payload, 'normal');
  }
  /**
   * Remove self.
   */
  remove(ecModel, api) {
    this.group.removeAll();
  }
  /**
   * Dispose self.
   */
  dispose(ecModel, api) {}
  updateView(seriesModel, ecModel, api, payload) {
    this.render(seriesModel, ecModel, api, payload);
  }
  // FIXME never used?
  updateLayout(seriesModel, ecModel, api, payload) {
    this.render(seriesModel, ecModel, api, payload);
  }
  // FIXME never used?
  updateVisual(seriesModel, ecModel, api, payload) {
    this.render(seriesModel, ecModel, api, payload);
  }
  /**
   * Traverse the new rendered elements.
   *
   * It will traverse the new added element in progressive rendering.
   * And traverse all in normal rendering.
   */
  eachRendered(cb) {
    traverseElements(this.group, cb);
  }
  static markUpdateMethod(payload, methodName) {
    inner(payload).updateMethod = methodName;
  }
}
ChartView.protoInitialize = function () {
  const proto = ChartView.prototype;
  proto.type = 'chart';
}();
;
/**
 * Set state of single element
 */
function elSetState(el, state, highlightDigit) {
  if (el && isHighDownDispatcher(el)) {
    (state === 'emphasis' ? enterEmphasis : leaveEmphasis)(el, highlightDigit);
  }
}
function toggleHighlight(data, payload, state) {
  const dataIndex = modelUtil.queryDataIndex(data, payload);
  const highlightDigit = payload && payload.highlightKey != null ? getHighlightDigit(payload.highlightKey) : null;
  if (dataIndex != null) {
    each(modelUtil.normalizeToArray(dataIndex), function (dataIdx) {
      elSetState(data.getItemGraphicEl(dataIdx), state, highlightDigit);
    });
  } else {
    data.eachItemGraphicEl(function (el) {
      elSetState(el, state, highlightDigit);
    });
  }
}
clazzUtil.enableClassExtend(ChartView, ['dispose']);
clazzUtil.enableClassManagement(ChartView);
function renderTaskPlan(context) {
  return renderPlanner(context.model);
}
function renderTaskReset(context) {
  const seriesModel = context.model;
  const ecModel = context.ecModel;
  const api = context.api;
  const payload = context.payload;
  // FIXME: remove updateView updateVisual
  const progressiveRender = seriesModel.pipelineContext.progressiveRender;
  const view = context.view;
  const updateMethod = payload && inner(payload).updateMethod;
  const methodName = progressiveRender ? 'incrementalPrepareRender' : updateMethod && view[updateMethod] ? updateMethod
  // `appendData` is also supported when data amount
  // is less than progressive threshold.
  : 'render';
  if (methodName !== 'render') {
    view[methodName](seriesModel, ecModel, api, payload);
  }
  return progressMethodMap[methodName];
}
const progressMethodMap = {
  incrementalPrepareRender: {
    progress: function (params, context) {
      context.view.incrementalRender(params, context.model, context.ecModel, context.api, context.payload);
    }
  },
  render: {
    // Put view.render in `progress` to support appendData. But in this case
    // view.render should not be called in reset, otherwise it will be called
    // twise. Use `forceFirstProgress` to make sure that view.render is called
    // in any cases.
    forceFirstProgress: true,
    progress: function (params, context) {
      context.view.render(context.model, context.ecModel, context.api, context.payload);
    }
  }
};
export default ChartView;