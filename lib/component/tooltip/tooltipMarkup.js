
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
import { getTooltipMarker, encodeHTML, makeValueReadable, convertToColorString } from '../../util/format.js';
import { isString, each, hasOwn, isArray, map, assert, extend } from 'zrender/lib/core/util.js';
import { SortOrderComparator } from '../../data/helper/dataValueHelper.js';
import { getRandomIdBase } from '../../util/number.js';
const TOOLTIP_LINE_HEIGHT_CSS = 'line-height:1';
// TODO: more textStyle option
function getTooltipTextStyle(textStyle, renderMode) {
  const nameFontColor = textStyle.color || '#6e7079';
  const nameFontSize = textStyle.fontSize || 12;
  const nameFontWeight = textStyle.fontWeight || '400';
  const valueFontColor = textStyle.color || '#464646';
  const valueFontSize = textStyle.fontSize || 14;
  const valueFontWeight = textStyle.fontWeight || '900';
  if (renderMode === 'html') {
    // `textStyle` is probably from user input, should be encoded to reduce security risk.
    return {
      // eslint-disable-next-line max-len
      nameStyle: `font-size:${encodeHTML(nameFontSize + '')}px;color:${encodeHTML(nameFontColor)};font-weight:${encodeHTML(nameFontWeight + '')}`,
      // eslint-disable-next-line max-len
      valueStyle: `font-size:${encodeHTML(valueFontSize + '')}px;color:${encodeHTML(valueFontColor)};font-weight:${encodeHTML(valueFontWeight + '')}`
    };
  } else {
    return {
      nameStyle: {
        fontSize: nameFontSize,
        fill: nameFontColor,
        fontWeight: nameFontWeight
      },
      valueStyle: {
        fontSize: valueFontSize,
        fill: valueFontColor,
        fontWeight: valueFontWeight
      }
    };
  }
}
// See `TooltipMarkupLayoutIntent['innerGapLevel']`.
// (value from UI design)
const HTML_GAPS = [0, 10, 20, 30];
const RICH_TEXT_GAPS = ['', '\n', '\n\n', '\n\n\n'];
// eslint-disable-next-line max-len
export function createTooltipMarkup(type, option) {
  option.type = type;
  return option;
}
function isSectionFragment(frag) {
  return frag.type === 'section';
}
function getBuilder(frag) {
  return isSectionFragment(frag) ? buildSection : buildNameValue;
}
function getBlockGapLevel(frag) {
  if (isSectionFragment(frag)) {
    let gapLevel = 0;
    const subBlockLen = frag.blocks.length;
    const hasInnerGap = subBlockLen > 1 || subBlockLen > 0 && !frag.noHeader;
    each(frag.blocks, function (subBlock) {
      const subGapLevel = getBlockGapLevel(subBlock);
      // If the some of the sub-blocks have some gaps (like 10px) inside, this block
      // should use a larger gap (like 20px) to distinguish those sub-blocks.
      if (subGapLevel >= gapLevel) {
        gapLevel = subGapLevel + +(hasInnerGap && (
        // 0 always can not be readable gap level.
        !subGapLevel
        // If no header, always keep the sub gap level. Otherwise
        // look weird in case `multipleSeries`.
        || isSectionFragment(subBlock) && !subBlock.noHeader));
      }
    });
    return gapLevel;
  }
  return 0;
}
function buildSection(ctx, fragment, topMarginForOuterGap, toolTipTextStyle) {
  const noHeader = fragment.noHeader;
  const gaps = getGap(getBlockGapLevel(fragment));
  const subMarkupTextList = [];
  let subBlocks = fragment.blocks || [];
  assert(!subBlocks || isArray(subBlocks));
  subBlocks = subBlocks || [];
  const orderMode = ctx.orderMode;
  if (fragment.sortBlocks && orderMode) {
    subBlocks = subBlocks.slice();
    const orderMap = {
      valueAsc: 'asc',
      valueDesc: 'desc'
    };
    if (hasOwn(orderMap, orderMode)) {
      const comparator = new SortOrderComparator(orderMap[orderMode], null);
      subBlocks.sort((a, b) => comparator.evaluate(a.sortParam, b.sortParam));
    }
    // FIXME 'seriesDesc' necessary?
    else if (orderMode === 'seriesDesc') {
      subBlocks.reverse();
    }
  }
  each(subBlocks, function (subBlock, idx) {
    const valueFormatter = fragment.valueFormatter;
    const subMarkupText = getBuilder(subBlock)(
    // Inherit valueFormatter
    valueFormatter ? extend(extend({}, ctx), {
      valueFormatter
    }) : ctx, subBlock, idx > 0 ? gaps.html : 0, toolTipTextStyle);
    subMarkupText != null && subMarkupTextList.push(subMarkupText);
  });
  const subMarkupText = ctx.renderMode === 'richText' ? subMarkupTextList.join(gaps.richText) : wrapBlockHTML(subMarkupTextList.join(''), noHeader ? topMarginForOuterGap : gaps.html);
  if (noHeader) {
    return subMarkupText;
  }
  const displayableHeader = makeValueReadable(fragment.header, 'ordinal', ctx.useUTC);
  const {
    nameStyle
  } = getTooltipTextStyle(toolTipTextStyle, ctx.renderMode);
  if (ctx.renderMode === 'richText') {
    return wrapInlineNameRichText(ctx, displayableHeader, nameStyle) + gaps.richText + subMarkupText;
  } else {
    return wrapBlockHTML(`<div style="${nameStyle};${TOOLTIP_LINE_HEIGHT_CSS};">` + encodeHTML(displayableHeader) + '</div>' + subMarkupText, topMarginForOuterGap);
  }
}
function buildNameValue(ctx, fragment, topMarginForOuterGap, toolTipTextStyle) {
  const renderMode = ctx.renderMode;
  const noName = fragment.noName;
  const noValue = fragment.noValue;
  const noMarker = !fragment.markerType;
  const name = fragment.name;
  const useUTC = ctx.useUTC;
  const valueFormatter = fragment.valueFormatter || ctx.valueFormatter || (value => {
    value = isArray(value) ? value : [value];
    return map(value, (val, idx) => makeValueReadable(val, isArray(valueTypeOption) ? valueTypeOption[idx] : valueTypeOption, useUTC));
  });
  if (noName && noValue) {
    return;
  }
  const markerStr = noMarker ? '' : ctx.markupStyleCreator.makeTooltipMarker(fragment.markerType, fragment.markerColor || '#333', renderMode);
  const readableName = noName ? '' : makeValueReadable(name, 'ordinal', useUTC);
  const valueTypeOption = fragment.valueType;
  const readableValueList = noValue ? [] : valueFormatter(fragment.value, fragment.dataIndex);
  const valueAlignRight = !noMarker || !noName;
  // It little weird if only value next to marker but far from marker.
  const valueCloseToMarker = !noMarker && noName;
  const {
    nameStyle,
    valueStyle
  } = getTooltipTextStyle(toolTipTextStyle, renderMode);
  return renderMode === 'richText' ? (noMarker ? '' : markerStr) + (noName ? '' : wrapInlineNameRichText(ctx, readableName, nameStyle))
  // Value has commas inside, so use ' ' as delimiter for multiple values.
  + (noValue ? '' : wrapInlineValueRichText(ctx, readableValueList, valueAlignRight, valueCloseToMarker, valueStyle)) : wrapBlockHTML((noMarker ? '' : markerStr) + (noName ? '' : wrapInlineNameHTML(readableName, !noMarker, nameStyle)) + (noValue ? '' : wrapInlineValueHTML(readableValueList, valueAlignRight, valueCloseToMarker, valueStyle)), topMarginForOuterGap);
}
/**
 * @return markupText. null/undefined means no content.
 */
export function buildTooltipMarkup(fragment, markupStyleCreator, renderMode, orderMode, useUTC, toolTipTextStyle) {
  if (!fragment) {
    return;
  }
  const builder = getBuilder(fragment);
  const ctx = {
    useUTC: useUTC,
    renderMode: renderMode,
    orderMode: orderMode,
    markupStyleCreator: markupStyleCreator,
    valueFormatter: fragment.valueFormatter
  };
  return builder(ctx, fragment, 0, toolTipTextStyle);
}
function getGap(gapLevel) {
  return {
    html: HTML_GAPS[gapLevel],
    richText: RICH_TEXT_GAPS[gapLevel]
  };
}
function wrapBlockHTML(encodedContent, topGap) {
  const clearfix = '<div style="clear:both"></div>';
  const marginCSS = `margin: ${topGap}px 0 0`;
  return `<div style="${marginCSS};${TOOLTIP_LINE_HEIGHT_CSS};">` + encodedContent + clearfix + '</div>';
}
function wrapInlineNameHTML(name, leftHasMarker, style) {
  const marginCss = leftHasMarker ? 'margin-left:2px' : '';
  return `<span style="${style};${marginCss}">` + encodeHTML(name) + '</span>';
}
function wrapInlineValueHTML(valueList, alignRight, valueCloseToMarker, style) {
  // Do not too close to marker, considering there are multiple values separated by spaces.
  const paddingStr = valueCloseToMarker ? '10px' : '20px';
  const alignCSS = alignRight ? `float:right;margin-left:${paddingStr}` : '';
  valueList = isArray(valueList) ? valueList : [valueList];
  return `<span style="${alignCSS};${style}">`
  // Value has commas inside, so use '  ' as delimiter for multiple values.
  + map(valueList, value => encodeHTML(value)).join('&nbsp;&nbsp;') + '</span>';
}
function wrapInlineNameRichText(ctx, name, style) {
  return ctx.markupStyleCreator.wrapRichTextStyle(name, style);
}
function wrapInlineValueRichText(ctx, values, alignRight, valueCloseToMarker, style) {
  const styles = [style];
  const paddingLeft = valueCloseToMarker ? 10 : 20;
  alignRight && styles.push({
    padding: [0, 0, 0, paddingLeft],
    align: 'right'
  });
  // Value has commas inside, so use '  ' as delimiter for multiple values.
  return ctx.markupStyleCreator.wrapRichTextStyle(isArray(values) ? values.join('  ') : values, styles);
}
export function retrieveVisualColorForTooltipMarker(series, dataIndex) {
  const style = series.getData().getItemVisual(dataIndex, 'style');
  const color = style[series.visualDrawType];
  return convertToColorString(color);
}
export function getPaddingFromTooltipModel(model, renderMode) {
  const padding = model.get('padding');
  return padding != null ? padding
  // We give slightly different to look pretty.
  : renderMode === 'richText' ? [8, 10] : 10;
}
/**
 * The major feature is generate styles for `renderMode: 'richText'`.
 * But it also serves `renderMode: 'html'` to provide
 * "renderMode-independent" API.
 */
export class TooltipMarkupStyleCreator {
  constructor() {
    this.richTextStyles = {};
    // Notice that "generate a style name" usually happens repeatedly when mouse is moving and
    // a tooltip is displayed. So we put the `_nextStyleNameId` as a member of each creator
    // rather than static shared by all creators (which will cause it increase to fast).
    this._nextStyleNameId = getRandomIdBase();
  }
  _generateStyleName() {
    return '__EC_aUTo_' + this._nextStyleNameId++;
  }
  makeTooltipMarker(markerType, colorStr, renderMode) {
    const markerId = renderMode === 'richText' ? this._generateStyleName() : null;
    const marker = getTooltipMarker({
      color: colorStr,
      type: markerType,
      renderMode,
      markerId: markerId
    });
    if (isString(marker)) {
      return marker;
    } else {
      if (process.env.NODE_ENV !== 'production') {
        assert(markerId);
      }
      this.richTextStyles[markerId] = marker.style;
      return marker.content;
    }
  }
  /**
   * @usage
   * ```ts
   * const styledText = markupStyleCreator.wrapRichTextStyle([
   *     // The styles will be auto merged.
   *     {
   *         fontSize: 12,
   *         color: 'blue'
   *     },
   *     {
   *         padding: 20
   *     }
   * ]);
   * ```
   */
  wrapRichTextStyle(text, styles) {
    const finalStl = {};
    if (isArray(styles)) {
      each(styles, stl => extend(finalStl, stl));
    } else {
      extend(finalStl, styles);
    }
    const styleName = this._generateStyleName();
    this.richTextStyles[styleName] = finalStl;
    return `{${styleName}|${text}}`;
  }
}