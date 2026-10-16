# Extraction

A standalone dental extraction note tool. Runs entirely in the browser with no installation, dependencies, or build step.

## Files

- `index.html` — page layout and form fields
- `style.css` — responsive layout, glass panels, buttons, tags, and chart styles
- `script.js` — tooth selection, diagnoses, treatments, saved drafts, and note generation
- `README.md` — setup and update instructions

Keep the three application files together. Open `index.html` to use the tool locally.

## Update GitHub Pages

1. Extract `Extraction.zip`.
2. Upload `index.html`, `style.css`, and `script.js` together into your existing Extraction repository or site folder, replacing the previous files. Include this README if wanted.
3. Commit the changes. For a new GitHub Pages repository, choose **Settings → Pages → Deploy from a branch**, then select the branch and folder containing `index.html`.
4. After GitHub Pages finishes deploying, reload the site. Use **Command–Shift–R** if the browser still displays an older version.

No package manager, build command, or generated output directory is needed. File and directory names are case sensitive on GitHub Pages.

## Features

- Permanent, primary, and mixed dentition; individual and quadrant selection
- Grouped diagnosis tags, Select all, and finding colors on the tooth chart
- Planned and provided treatments, extraction crosses, and connected alveoloplasty lines
- Conditional anesthesia, flap, forceps, surgical bur, Cryer, and suture fields
- Generated postoperative care and multiple prescription selections
- Editable note with bold line titles, Copy Note, and confirmed Clear All
- Browser-local autosave using `extraction-note-v1`

Existing saved drafts remain compatible. Changing a form input regenerates the note and replaces manual note edits. Drafts stay in the browser and are not uploaded by this application. Local files and hosted sites have separate browser storage.

Prescription labels and clinical text are configurable in `index.html` and `script.js`. Review the completed note before using it.
