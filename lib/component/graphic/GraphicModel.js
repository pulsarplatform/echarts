
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
import * as modelUtil from '../../util/model.js';
import ComponentModel from '../../model/Component.js';
import { copyLayoutParams, mergeLayoutParam } from '../../util/layout.js';
;
;
;
export function setKeyInfoToNewElOption(resultItem, newElOption) {
  const existElOption = resultItem.existing;
  // Set id and type after id assigned.
  newElOption.id = resultItem.keyInfo.id;
  !newElOption.type && existElOption && (newElOption.type = existElOption.type);
  // Set parent id if not specified
  if (newElOption.parentId == null) {
    const newElParentOption = newElOption.parentOption;
    if (newElParentOption) {
      newElOption.parentId = newElParentOption.id;
    } else if (existElOption) {
      newElOption.parentId = existElOption.parentId;
    }
  }
  // Clear
  newElOption.parentOption = null;
}
function isSetLoc(obj, props) {
  let isSet;
  zrUtil.each(props, function (prop) {
    obj[prop] != null && obj[prop] !== 'auto' && (isSet = true);
  });
  return isSet;
}
function mergeNewElOptionToExist(existList, index, newElOption) {
  // Update existing options, for `getOption` feature.
  const newElOptCopy = zrUtil.extend({}, newElOption);
  const existElOption = existList[index];
  const $action = newElOption.$action || 'merge';
  if ($action === 'merge') {
    if (existElOption) {
      if (process.env.NODE_ENV !== 'production') {
        const newType = newElOption.type;
        zrUtil.assert(!newType || existElOption.type === newType, 'Please set $action: "replace" to change `type`');
      }
      // We can ensure that newElOptCopy and existElOption are not
      // the same object, so `merge` will not change newElOptCopy.
      zrUtil.merge(existElOption, newElOptCopy, true);
      // Rigid body, use ignoreSize.
      mergeLayoutParam(existElOption, newElOptCopy, {
        ignoreSize: true
      });
      // Will be used in render.
      copyLayoutParams(newElOption, existElOption);
      // Copy transition info to new option so it can be used in the transition.
      // DO IT AFTER merge
      copyTransitionInfo(newElOption, existElOption);
      copyTransitionInfo(newElOption, existElOption, 'shape');
      copyTransitionInfo(newElOption, existElOption, 'style');
      copyTransitionInfo(newElOption, existElOption, 'extra');
      // Copy clipPath
      newElOption.clipPath = existElOption.clipPath;
    } else {
      existList[index] = newElOptCopy;
    }
  } else if ($action === 'replace') {
    existList[index] = newElOptCopy;
  } else if ($action === 'remove') {
    // null will be cleaned later.
    existElOption && (existList[index] = null);
  }
}
const TRANSITION_PROPS_TO_COPY = ['transition', 'enterFrom', 'leaveTo'];
const ROOT_TRANSITION_PROPS_TO_COPY = TRANSITION_PROPS_TO_COPY.concat(['enterAnimation', 'updateAnimation', 'leaveAnimation']);
function copyTransitionInfo(target, source, targetProp) {
  if (targetProp) {
    if (!target[targetProp] && source[targetProp]) {
      // TODO avoid creating this empty object when there is no transition configuration.
      target[targetProp] = {};
    }
    target = target[targetProp];
    source = source[targetProp];
  }
  if (!target || !source) {
    return;
  }
  const props = targetProp ? TRANSITION_PROPS_TO_COPY : ROOT_TRANSITION_PROPS_TO_COPY;
  for (let i = 0; i < props.length; i++) {
    const prop = props[i];
    if (target[prop] == null && source[prop] != null) {
      target[prop] = source[prop];
    }
  }
}
function setLayoutInfoToExist(existItem, newElOption) {
  if (!existItem) {
    return;
  }
  existItem.hv = newElOption.hv = [
  // Rigid body, don't care about `width`.
  isSetLoc(newElOption, ['left', 'right']),
  // Rigid body, don't care about `height`.
  isSetLoc(newElOption, ['top', 'bottom'])];
  // Give default group size. Otherwise layout error may occur.
  if (existItem.type === 'group') {
    const existingGroupOpt = existItem;
    const newGroupOpt = newElOption;
    existingGroupOpt.width == null && (existingGroupOpt.width = newGroupOpt.width = 0);
    existingGroupOpt.height == null && (existingGroupOpt.height = newGroupOpt.height = 0);
  }
}
export class GraphicComponentModel extends ComponentModel {
  constructor() {
    super(...arguments);
    this.type = GraphicComponentModel.type;
    this.preventAutoZ = true;
  }
  mergeOption(option, ecModel) {
    // Prevent default merge to elements
    const elements = this.option.elements;
    this.option.elements = null;
    super.mergeOption(option, ecModel);
    this.option.elements = elements;
  }
  optionUpdated(newOption, isInit) {
    const thisOption = this.option;
    const newList = (isInit ? thisOption : newOption).elements;
    const existList = thisOption.elements = isInit ? [] : thisOption.elements;
    const flattenedList = [];
    this._flatten(newList, flattenedList, null);
    const mappingResult = modelUtil.mappingToExists(existList, flattenedList, 'normalMerge');
    // Clear elOptionsToUpdate
    const elOptionsToUpdate = this._elOptionsToUpdate = [];
    zrUtil.each(mappingResult, function (resultItem, index) {
      const newElOption = resultItem.newOption;
      if (process.env.NODE_ENV !== 'production') {
        zrUtil.assert(zrUtil.isObject(newElOption) || resultItem.existing, 'Empty graphic option definition');
      }
      if (!newElOption) {
        return;
      }
      elOptionsToUpdate.push(newElOption);
      setKeyInfoToNewElOption(resultItem, newElOption);
      mergeNewElOptionToExist(existList, index, newElOption);
      setLayoutInfoToExist(existList[index], newElOption);
    }, this);
    // Clean
    thisOption.elements = zrUtil.filter(existList, item => {
      // $action should be volatile, otherwise option gotten from
      // `getOption` will contain unexpected $action.
      item && delete item.$action;
      return item != null;
    });
  }
  /**
   * Convert
   * [{
   *  type: 'group',
   *  id: 'xx',
   *  children: [{type: 'circle'}, {type: 'polygon'}]
   * }]
   * to
   * [
   *  {type: 'group', id: 'xx'},
   *  {type: 'circle', parentId: 'xx'},
   *  {type: 'polygon', parentId: 'xx'}
   * ]
   */
  _flatten(optionList, result, parentOption) {
    zrUtil.each(optionList, function (option) {
      if (!option) {
        return;
      }
      if (parentOption) {
        option.parentOption = parentOption;
      }
      result.push(option);
      const children = option.children;
      // here we don't judge if option.type is `group`
      // when new option doesn't provide `type`, it will cause that the children can't be updated.
      if (children && children.length) {
        this._flatten(children, result, option);
      }
      // Deleting for JSON output, and for not affecting group creation.
      delete option.children;
    }, this);
  }
  // FIXME
  // Pass to view using payload? setOption has a payload?
  useElOptionsToUpdate() {
    const els = this._elOptionsToUpdate;
    // Clear to avoid render duplicately when zooming.
    this._elOptionsToUpdate = null;
    return els;
  }
}
GraphicComponentModel.type = 'graphic';
GraphicComponentModel.defaultOption = {
  elements: []
  // parentId: null
};