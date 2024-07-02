
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
import VisualMapView from './VisualMapView.js';
import * as graphic from '../../util/graphic.js';
import { createSymbol } from '../../util/symbol.js';
import * as layout from '../../util/layout.js';
import * as helper from './helper.js';
import { createTextStyle } from '../../label/labelStyle.js';
class PiecewiseVisualMapView extends VisualMapView {
  constructor() {
    super(...arguments);
    this.type = PiecewiseVisualMapView.type;
  }
  doRender() {
    const thisGroup = this.group;
    thisGroup.removeAll();
    const visualMapModel = this.visualMapModel;
    const textGap = visualMapModel.get('textGap');
    const textStyleModel = visualMapModel.textStyleModel;
    const textFont = textStyleModel.getFont();
    const textFill = textStyleModel.getTextColor();
    const itemAlign = this._getItemAlign();
    const itemSize = visualMapModel.itemSize;
    const viewData = this._getViewData();
    const endsText = viewData.endsText;
    const showLabel = zrUtil.retrieve(visualMapModel.get('showLabel', true), !endsText);
    endsText && this._renderEndsText(thisGroup, endsText[0], itemSize, showLabel, itemAlign);
    zrUtil.each(viewData.viewPieceList, function (item) {
      const piece = item.piece;
      const itemGroup = new graphic.Group();
      itemGroup.onclick = zrUtil.bind(this._onItemClick, this, piece);
      this._enableHoverLink(itemGroup, item.indexInModelPieceList);
      // TODO Category
      const representValue = visualMapModel.getRepresentValue(piece);
      this._createItemSymbol(itemGroup, representValue, [0, 0, itemSize[0], itemSize[1]]);
      if (showLabel) {
        const visualState = this.visualMapModel.getValueState(representValue);
        itemGroup.add(new graphic.Text({
          style: {
            x: itemAlign === 'right' ? -textGap : itemSize[0] + textGap,
            y: itemSize[1] / 2,
            text: piece.text,
            verticalAlign: 'middle',
            align: itemAlign,
            font: textFont,
            fill: textFill,
            opacity: visualState === 'outOfRange' ? 0.5 : 1
          }
        }));
      }
      thisGroup.add(itemGroup);
    }, this);
    endsText && this._renderEndsText(thisGroup, endsText[1], itemSize, showLabel, itemAlign);
    layout.box(visualMapModel.get('orient'), thisGroup, visualMapModel.get('itemGap'));
    this.renderBackground(thisGroup);
    this.positionGroup(thisGroup);
  }
  _enableHoverLink(itemGroup, pieceIndex) {
    itemGroup.on('mouseover', () => onHoverLink('highlight')).on('mouseout', () => onHoverLink('downplay'));
    const onHoverLink = method => {
      const visualMapModel = this.visualMapModel;
      // TODO: TYPE More detailed action types
      visualMapModel.option.hoverLink && this.api.dispatchAction({
        type: method,
        batch: helper.makeHighDownBatch(visualMapModel.findTargetDataIndices(pieceIndex), visualMapModel)
      });
    };
  }
  _getItemAlign() {
    const visualMapModel = this.visualMapModel;
    const modelOption = visualMapModel.option;
    if (modelOption.orient === 'vertical') {
      return helper.getItemAlign(visualMapModel, this.api, visualMapModel.itemSize);
    } else {
      // horizontal, most case left unless specifying right.
      let align = modelOption.align;
      if (!align || align === 'auto') {
        align = 'left';
      }
      return align;
    }
  }
  _renderEndsText(group, text, itemSize, showLabel, itemAlign) {
    if (!text) {
      return;
    }
    const itemGroup = new graphic.Group();
    const textStyleModel = this.visualMapModel.textStyleModel;
    itemGroup.add(new graphic.Text({
      style: createTextStyle(textStyleModel, {
        x: showLabel ? itemAlign === 'right' ? itemSize[0] : 0 : itemSize[0] / 2,
        y: itemSize[1] / 2,
        verticalAlign: 'middle',
        align: showLabel ? itemAlign : 'center',
        text
      })
    }));
    group.add(itemGroup);
  }
  /**
   * @private
   * @return {Object} {peiceList, endsText} The order is the same as screen pixel order.
   */
  _getViewData() {
    const visualMapModel = this.visualMapModel;
    const viewPieceList = zrUtil.map(visualMapModel.getPieceList(), function (piece, index) {
      return {
        piece: piece,
        indexInModelPieceList: index
      };
    });
    let endsText = visualMapModel.get('text');
    // Consider orient and inverse.
    const orient = visualMapModel.get('orient');
    const inverse = visualMapModel.get('inverse');
    // Order of model pieceList is always [low, ..., high]
    if (orient === 'horizontal' ? inverse : !inverse) {
      viewPieceList.reverse();
    }
    // Origin order of endsText is [high, low]
    else if (endsText) {
      endsText = endsText.slice().reverse();
    }
    return {
      viewPieceList: viewPieceList,
      endsText: endsText
    };
  }
  _createItemSymbol(group, representValue, shapeParam) {
    group.add(createSymbol(
    // symbol will be string
    this.getControllerVisual(representValue, 'symbol'), shapeParam[0], shapeParam[1], shapeParam[2], shapeParam[3],
    // color will be string
    this.getControllerVisual(representValue, 'color')));
  }
  _onItemClick(piece) {
    const visualMapModel = this.visualMapModel;
    const option = visualMapModel.option;
    const selectedMode = option.selectedMode;
    if (!selectedMode) {
      return;
    }
    const selected = zrUtil.clone(option.selected);
    const newKey = visualMapModel.getSelectedMapKey(piece);
    if (selectedMode === 'single' || selectedMode === true) {
      selected[newKey] = true;
      zrUtil.each(selected, function (o, key) {
        selected[key] = key === newKey;
      });
    } else {
      selected[newKey] = !selected[newKey];
    }
    this.api.dispatchAction({
      type: 'selectDataRange',
      from: this.uid,
      visualMapId: this.visualMapModel.id,
      selected: selected
    });
  }
}
PiecewiseVisualMapView.type = 'visualMap.piecewise';
export default PiecewiseVisualMapView;