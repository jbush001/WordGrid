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


# https://en.wikipedia.org/wiki/Letter_frequency
RAW_FREQ = [
    ('A', 7.8),
    ('B', 2.0),
    ('C', 4.0),
    ('D', 3.8),
    ('E', 11.0),
    ('F', 1.4),
    ('G', 3.0),
    ('H', 2.3),
    ('I', 8.6),
    ('J', 0.21),
    ('K', 0.97),
    ('L', 5.3),
    ('M', 2.7),
    ('N', 7.2),
    ('O', 6.1),
    ('P', 2.8),
    ('Q', 0.19),
    ('R', 7.3),
    ('S', 8.7),
    ('T', 6.7),
    ('U', 3.3),
    ('V', 1.0),
    ('W', 0.91),
    ('X', 0.27),
    ('Y', 1.6),
    ('Z', 0.44),
]

RAW_FREQ.sort(key=lambda x: x[1])

cum_freq = []
total = 0
for letter, freq in RAW_FREQ:
    total += freq / 100
    if total > 1:
        total = 1

    cum_freq.append([letter, round(total, 4)])

cum_freq[-1][1] = 1.0
print(cum_freq)