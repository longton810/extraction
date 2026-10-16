# Extraction note project

Open index.html in a browser. Matches the Composite project's tooth artwork, COHRI sections, anesthesia options, preceptor fields, editable note, copy action, and browser-local draft saving.

Select teeth, enter findings and care actually provided, and review the generated note. Form changes regenerate the note; direct note edits are saved until the next form change. Switching dentition clears tooth selections. Clear All requires confirmation.

Load document example replaces the current draft with the supplied extraction example. The example omits dissolving-suture instructions because the source says no sutures were used. The CHX quantity in the source is recorded as needing prescriber confirmation rather than silently changing its unit. Medication text is editable documentation, not a prescribing recommendation. No clinical completion checkboxes are preselected on a new draft.

No server or external services required. Browser drafts use the separate extraction-note-v1 storage key.
