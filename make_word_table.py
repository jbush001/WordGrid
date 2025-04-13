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

# Usage: python3 make_word_table.py <words file>

import sys

with open('words.json', 'w') as outfile:
    outfile.write('[\n')
    first_line = True
    with open(sys.argv[1]) as infile:
        for line in infile:
            if line[0].isupper() and line[1].islower():
                continue # Skip proper nouns

            cleaned = line.strip().upper()
            if len(cleaned) < 3:
                continue

            if not first_line:
                outfile.write(',\n')

            first_line = False
            outfile.write(f'    "{cleaned}"')

    outfile.write('\n]\n')