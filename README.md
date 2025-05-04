To run locally:

    python3 -m http.server

Open browser to <http://localhost:8000>

The word list was derived from from the Moby public domain word list,
<https://en.wikipedia.org/wiki/Moby_Project>, specifically

    python3 make_word_table.py CROSSWD.TXT CRSWD-D.TXT

The alphabet frequency table is generated from that:

    python3 make_freq_table.py

The output from this command is copy/pasted into the top of index.js.
