
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
import { getECData } from '../../util/innerStore.js';
import * as layout from '../../util/layout.js';
import { wrapTreePathInfo } from '../helper/treeHelper.js';
import { curry, defaults } from 'zrender/lib/core/util.js';
import { convertOptionIdName } from '../../util/model.js';
import { toggleHoverEmphasis, Z2_EMPHASIS_LIFT } from '../../util/states.js';
import { createTextStyle } from '../../label/labelStyle.js';
const TEXT_PADDING = 8;
const ITEM_GAP = 8;
const ARRAY_LENGTH = 5;
class Breadcrumb {
  constructor(containerGroup) {
    this.group = new graphic.Group();
    containerGroup.add(this.group);
  }
  render(seriesModel, api, targetNode, onSelect) {
    const model = seriesModel.getModel('breadcrumb');
    const thisGroup = this.group;
    thisGroup.removeAll();
    if (!model.get('show') || !targetNode) {
      return;
    }
    const normalStyleModel = model.getModel('itemStyle');
    const emphasisModel = model.getModel('emphasis');
    const textStyleModel = normalStyleModel.getModel('textStyle');
    const emphasisTextStyleModel = emphasisModel.getModel(['itemStyle', 'textStyle']);
    const layoutParam = {
      pos: {
        left: model.get('left'),
        right: model.get('right'),
        top: model.get('top'),
        bottom: model.get('bottom')
      },
      box: {
        width: api.getWidth(),
        height: api.getHeight()
      },
      emptyItemWidth: model.get('emptyItemWidth'),
      totalWidth: 0,
      renderList: []
    };
    this._prepare(targetNode, layoutParam, textStyleModel);
    this._renderContent(seriesModel, layoutParam, normalStyleModel, emphasisModel, textStyleModel, emphasisTextStyleModel, onSelect);
    layout.positionElement(thisGroup, layoutParam.pos, layoutParam.box);
  }
  /**
   * Prepare render list and total width
   * @private
   */
  _prepare(targetNode, layoutParam, textStyleModel) {
    for (let node = targetNode; node; node = node.parentNode) {
      const text = convertOptionIdName(node.getModel().get('name'), '');
      const textRect = textStyleModel.getTextRect(text);
      const itemWidth = Math.max(textRect.width + TEXT_PADDING * 2, layoutParam.emptyItemWidth);
      layoutParam.totalWidth += itemWidth + ITEM_GAP;
      layoutParam.renderList.push({
        node: node,
        text: text,
        width: itemWidth
      });
    }
  }
  /**
   * @private
   */
  _renderContent(seriesModel, layoutParam, normalStyleModel, emphasisModel, textStyleModel, emphasisTextStyleModel, onSelect) {
    // Start rendering.
    let lastX = 0;
    const emptyItemWidth = layoutParam.emptyItemWidth;
    const height = seriesModel.get(['breadcrumb', 'height']);
    const availableSize = layout.getAvailableSize(layoutParam.pos, layoutParam.box);
    let totalWidth = layoutParam.totalWidth;
    const renderList = layoutParam.renderList;
    const emphasisItemStyle = emphasisModel.getModel('itemStyle').getItemStyle();
    for (let i = renderList.length - 1; i >= 0; i--) {
      const item = renderList[i];
      const itemNode = item.node;
      let itemWidth = item.width;
      let text = item.text;
      // Hdie text and shorten width if necessary.
      if (totalWidth > availableSize.width) {
        totalWidth -= itemWidth - emptyItemWidth;
        itemWidth = emptyItemWidth;
        text = null;
      }
      const el = new graphic.Polygon({
        shape: {
          points: makeItemPoints(lastX, 0, itemWidth, height, i === renderList.length - 1, i === 0)
        },
        style: defaults(normalStyleModel.getItemStyle(), {
          lineJoin: 'bevel'
        }),
        textContent: new graphic.Text({
          style: createTextStyle(textStyleModel, {
            text
          })
        }),
        textConfig: {
          position: 'inside'
        },
        z2: Z2_EMPHASIS_LIFT * 1e4,
        onclick: curry(onSelect, itemNode)
      });
      el.disableLabelAnimation = true;
      el.getTextContent().ensureState('emphasis').style = createTextStyle(emphasisTextStyleModel, {
        text
      });
      el.ensureState('emphasis').style = emphasisItemStyle;
      toggleHoverEmphasis(el, emphasisModel.get('focus'), emphasisModel.get('blurScope'), emphasisModel.get('disabled'));
      this.group.add(el);
      packEventData(el, seriesModel, itemNode);
      lastX += itemWidth + ITEM_GAP;
    }
  }
  remove() {
    this.group.removeAll();
  }
}
function makeItemPoints(x, y, itemWidth, itemHeight, head, tail) {
  const points = [[head ? x : x - ARRAY_LENGTH, y], [x + itemWidth, y], [x + itemWidth, y + itemHeight], [head ? x : x - ARRAY_LENGTH, y + itemHeight]];
  !tail && points.splice(2, 0, [x + itemWidth + ARRAY_LENGTH, y + itemHeight / 2]);
  !head && points.push([x, y + itemHeight / 2]);
  return points;
}
// Package custom mouse event.
function packEventData(el, seriesModel, itemNode) {
  getECData(el).eventData = {
    componentType: 'series',
    componentSubType: 'treemap',
    componentIndex: seriesModel.componentIndex,
    seriesIndex: seriesModel.seriesIndex,
    seriesName: seriesModel.name,
    seriesType: 'treemap',
    selfType: 'breadcrumb',
    nodeData: {
      dataIndex: itemNode && itemNode.dataIndex,
      name: itemNode && itemNode.name
    },
    treePathInfo: itemNode && wrapTreePathInfo(itemNode, seriesModel)
  };
}
export default Breadcrumb;