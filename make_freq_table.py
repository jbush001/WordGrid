#
# Copyright 2025 Jeff Bush
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

#
# Quick and dirty utility to massage the alphabet frequency table I pulled
# from wikipedia into a form the program can use.
#

import json
from collections import defaultdict

with open('words.json') as f:
    words = json.load(f)

raw_counts = defaultdict(int)
for word in words:
    for letter in word:
        raw_counts[letter.upper()] += 1

total = sum(raw_counts.values())
probabilities = sorted(
    [(letter, count / total) for letter, count in raw_counts.items()],
    key=lambda x: x[1]
)

cumulative_prob = []
total = 0
for letter, freq in probabilities:
    total = min(1, total + freq)
    cumulative_prob.append([letter, round(total, 4)])

print('const FREQ_TABLE = [\n    ', end='')
for i, (letter, prob) in enumerate(cumulative_prob):
    print(f'["{letter}", {prob:.04f}], ', end='')
    if i % 5 == 4:
        print('\n    ', end='')

print('\n];')
