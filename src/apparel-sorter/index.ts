/*
+Copyright (c) 2015, Grant Copley
+All rights reserved.
+
+Redistribution and use in source and binary forms, with or without
+modification, are permitted provided that the following conditions are met:
+
+* Redistributions of source code must retain the above copyright notice, this
+  list of conditions and the following disclaimer.
+
+* Redistributions in binary form must reproduce the above copyright notice,
+  this list of conditions and the following disclaimer in the documentation
+  and/or other materials provided with the distribution.
+
+THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
+AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
+IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
+DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
+FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
+DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
+SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
+CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
+OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
+OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
+*/

const regexes = [
  /^osfa.*$/i,
  /^one .*$/i,
  /^one$/i,
  /^xxs/i,
  /^xs .*$/i,
  /^x sm.*$/i,
  /^xs.*$/i,
  /^.* xs$/i,
  /^xs/i,
  /^sm.*$/i,
  /^.* small/i,
  /^ss/i,
  /^short sleeve/i,
  /^ls/i,
  /^long sleeve/i,
  /^s$/i,
  /^small.*$/i,
  /^s\/.*$/i,
  /^s \/.*$/i,
  /^s .*$/i,
  /^m$/i,
  /^medium.*$/i,
  /^.*med.*$/i,
  /^m .*$/i,
  /^m[A-Za-z]*/i,
  /^M\/.*$/i,
  /^l$/i,
  /^.*lg.*$/i,
  /^large.*$/i,
  /^l .*$/i,
  /^l\/.*$/i,
  /^lt$/i,
  /^xl.*$/i,
  /^x large.*$/i,
  /^.* XL$/i,
  /^x-l.*$/i,
  /^l[A-Za-z]*$/i,
  /^petite l.*$/i,
  /^1x.*$/i,
  /^.* 1x$/i,
  /^2x.*$/i,
  /^.* 2X$/i,
  /^XXL.*$/i,
  /^3x.*$/i,
  /^XXXL.*$/i,
  /^4x.*$/i,
  /^XXXXL.*$/i,
  /^5x.*$/i,
  /^XXXXXL.*$/i,
  /^6x.*$/i,
  /^XXXXXXL.*$/i,
  /^7x.*$/i,
  /^XXXXXXXL.*$/i,
  /^8x.*$/i,
  /^XXXXXXXL.*$/i,
  /^9x.*$/i,
  /^XXXXXXXXL.*$/i,
  /^10x.*$/i,
  /^XXXXXXXXXL.*$/i,
  /^11x.*$/i,
  /^XXXXXXXXXXL.*$/i,
  /^12x.*$/i,
  /^XXXXXXXXXXXL.*$/i,
  /^13x.*$/i,
  /^XXXXXXXXXXXXL.*$/i,
  /^14x.*$/i,
  /^XXXXXXXXXXXXXL.*$/i,
  /^15x.*$/i,
  /^XXXXXXXXXXXXXXL.*$/i,
  /^16x.*$/i,
  /^XXXXXXXXXXXXXXXL.*$/i,
  /^17x.*$/i,
  /^XXXXXXXXXXXXXXXXL.*$/i,
  /^18x.*$/i,
  /^XXXXXXXXXXXXXXXXXL.*$/i,
].map(function (regex, index) {
  return { regex: regex, index: index };
});

function findRegexMatch(patterns: any, iteration: any, size: any): any {
  if (patterns.length - 1 >= iteration) {
    if (size.search(patterns[iteration].regex) >= 0) {
      return { regex: patterns[iteration].regex, index: patterns[iteration].index, size: size, sizeVal: parseInt(size) || 0 };
    }
    return findRegexMatch(patterns, iteration = iteration + 1, size);
  }
  return { regex: "No Match", index: parseInt(size.replace(/[^\d.-]/g, '')), size: size, sizeVal: parseInt(size) || 0 };
}

function matchSizesWithRegexes(size: any) {
  return findRegexMatch(regexes, 0, size);
}


function sortSizesByIndex(size1: any, size2: any) {
  if (size1.index < size2.index || size1.sizeVal > 0 && size2.sizeVal > 0 && size1.sizeVal < size2.sizeVal) return -1;
  if (size1.index == size2.index || size1.sizeVal > 0 && size2.sizeVal > 0 && size1.sizeVal == size2.sizeVal) return 0;
  return 1;
}

function getSize(result: any) {
  return result.size;
}

function getIndex(result: any) {
  return result.index;
}

//////////////////////////////////////////////////////////////////

export function sortSizes(sizes: any) {
  if (!sizes) {
    return [];
  }
  return sizes
    .map(matchSizesWithRegexes)
    .sort(sortSizesByIndex)
    .map(getSize);
}

export function sizeIndex(size: any) {
  return [size]
    .map(matchSizesWithRegexes)
    .map(getIndex)[0] || 0;
}