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
    ('A', 8.2),
    ('B', 1.5),
    ('C', 2.8),
    ('D', 4.3),
    ('E', 12.7),
    ('F', 2.2),
    ('G', 2.0),
    ('H', 6.1),
    ('I', 7.0),
    ('J', 0.15),
    ('K', 0.77),
    ('L', 4.0),
    ('M', 2.4),
    ('N', 6.7),
    ('O', 7.5),
    ('P', 1.9),
    ('Q', 0.095),
    ('R', 6.0),
    ('S', 6.3),
    ('T', 9.1),
    ('U', 2.8),
    ('V', 0.98),
    ('W', 2.4),
    ('X', 0.15),
    ('Y', 2.0),
    ('Z', 0.074),
]

RAW_FREQ.sort(key=lambda x: x[1])

cum_freq = []
total = 0
for letter, freq in RAW_FREQ:
    total += freq / 100
    if total > 1:
        total = 1

    cum_freq.append([letter, total])

print(cum_freq)