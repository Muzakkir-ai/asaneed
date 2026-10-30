# Asaneed — Complete Book, Sanad and Ṭarīq Builder

## Project Information

Work on my existing **Asaneed (الأسانيد والإجازات)** application.

- **GitHub repository:** `Muzakkir-ai/asaneed`
- **Supabase project:** `sqyookpdpymgpwpnicyp`
- **Live website:** https://asaneed.vercel.app
- **Technology:** Next.js, Supabase and Vercel
- **Original application:** Zite
- **Interface language:** Arabic (RTL)
- **Arabic UI font:** Readex Pro

Use my connected GitHub, Supabase and Vercel integrations.

**Do not create a separate Turuq website. Do not rebuild Asaneed from scratch.**

Inspect the existing application and implement this functionality within its current architecture.

---

# 1. Main Objective

I want an easy way to add new **طرق وأسانيد الكتب** inside Asaneed.

The system should allow users to:

1. Register a new book.
2. Enter its author's name (صاحب الكتاب).
3. Enter the sanad from Imam Ibn al-Jazarī to the book's author.
4. Save the book and its sanad for future reuse.
5. Select a qirāʾah and riwāyah.
6. Enter the ṭarīq and its chain of narrators from the book's author to the selected rawī.
7. Save multiple ṭuruq under the same book.
8. Reuse narrators and previously entered chain segments.
9. Use the builder for both normal asānīd and additional shaykhs.

The main priority is **fast, convenient data entry**, not building a complicated historical research system.

Do not require narrator biographies, birth dates, death years, or detailed historical metadata at this stage.

---

# 2. Where This Functionality Should Be Available

Integrate the same reusable builder into:

### A. أسانيدي / إدارة الأسانيد

Users should be able to add new books and ṭuruq to the asānīd they are authorized to manage.

### B. المشايخ الإضافيون

Users should also be able to add books and ṭuruq for an additional shaykh.

When opened from an additional-shaykh profile, automatically associate the saved sanad or ṭarīq with that specific shaykh.

Do not use the currently selected issuing shaykh on الطلاب والشهادات as a global ownership filter.

Administrators should retain access to all records they are authorized to administer.

---

# 3. Two-Stage Entry System

Create a guided workflow with two main stages:

**المرحلة الأولى: إضافة الكتاب وإسناده**

**المرحلة الثانية: إضافة الروايات والطرق**

The user should be able to move between stages without losing entered information.

Use a clean step-by-step interface rather than one enormous form.

---

# 4. Stage One — إضافة كتاب وإسناده

When the user clicks **إضافة كتاب جديد**, ask for:

### Required fields

1. **اسم الكتاب**
2. **اسم صاحب الكتاب**
3. **الإسناد من الإمام ابن الجزري إلى صاحب الكتاب**

The author should be entered in the grammatical genitive form (حالة الجر), suitable for use after «عن».

### Example

**اسم الكتاب:** التيسير في القراءات السبع

**صاحب الكتاب:** أبي عمرو عثمان بن سعيد الداني

**إسناد الكتاب:**

الإمام ابن الجزري

↓

[اسم الشيخ الأول]

↓

[اسم الشيخ الثاني]

↓

[اسم الشيخ الثالث]

↓

أبي عمرو عثمان بن سعيد الداني

The intermediate names above are placeholders, not a verified historical sanad.

### Narrator Entry Interface

Each narrator should have a separate searchable input box.

Provide a small **+ راوٍ** button between every two names.

Users should be able to:

- Insert a narrator between existing names.
- Add multiple narrators.
- Remove an intermediate narrator.
- Reorder narrators.
- Search for names already stored in the application.
- Select an existing narrator instead of typing again.
- Enter a new name directly if it does not already exist.
- Correct spelling or grammatical form before saving.

Do not impose a fixed number of narrators.

### Name Requirements

When adding a new person, explicitly ask:

**اسم الراوي بصيغة الجر**

Store the name as entered.

If practical, support a canonical display name and a genitive name separately, but do not require users to fill in unnecessary details.

Avoid creating duplicate person records merely because one person appears in multiple asānīd.

---

# 5. Save Books Permanently

Once a book and its sanad are entered, save them in Supabase.

The saved book should remain available for future ṭuruq.

For example:

**التيسير في القراءات السبع**
- صاحب الكتاب: أبو عمرو الداني
- إسناد الكتاب الأول
- إسناد الكتاب الثاني, if applicable
- الروايات والطرق المرتبطة بالكتاب

When someone selects an existing book, automatically load its author and available book asānīd.

Do not ask users to re-enter the author's name or the entire book sanad.

### Multiple Book Asānīd

A single book may have more than one sanad from Ibn al-Jazarī to its author.

Allow users to add:

- إسناد الكتاب الأول
- إسناد الكتاب الثاني
- Additional book asānīd as necessary

Each sanad should be saved separately and be available for selection when adding ṭuruq.

Do not assume every book has exactly one transmission chain.

### Duplicate Prevention

When a user enters a book title that resembles an existing book:

- Show matching existing books.
- Allow selecting the saved book.
- Offer adding another sanad to it.
- Avoid accidental duplicate books.

Do not automatically merge genuinely different books.

---

# 6. Stage Two — إضافة الروايات والطرق

After saving or selecting a book, open the second stage.

Show the selected book and its author at the top.

For example:

**الكتاب:** التيسير في القراءات السبع

**صاحب الكتاب:** أبو عمرو الداني

Then ask for:

1. **القراءة**
2. **الرواية**
3. **الطريق**
4. **سلسلة الطريق من صاحب الكتاب إلى الراوي**
5. **إسناد الكتاب المستخدم**, when multiple book asānīd exist

### Qirāʾah and Riwāyah Selection

Use the existing Asaneed list of the ten qurrāʾ and their twenty rawīs.

When a qirāʾah is selected, display only its corresponding riwāyāt.

For example:

**القراءة:** نافع المدني

**الرواية:** قالون

Do not create duplicate qirāʾah or riwāyah records if they already exist in the database.

Reuse the application's existing naming conventions.

### Ṭarīq Selection

Ask for:

**اسم الطريق / صاحب الطريق**

For example:

طريق أبي نشيط

Allow selecting an existing ṭarīq or entering a new one.

The ṭarīq name must be stored separately from the ordered narrator sequence.

---

# 7. Visual Ṭarīq Chain Builder

The second-stage chain should begin with the saved book author and proceed to the selected rawī.

Example layout:

**صاحب الكتاب — أبو عمرو الداني**

↓

[اسم الراوي]

↓

**+ راوٍ**

↓

[اسم الراوي]

↓

**صاحب الطريق — إن وجد**

↓

[اسم الراوي]

↓

**الراوي — قالون**

↓

**القارئ — نافع المدني**

Allow unlimited intermediate narrator boxes.

### Important Structure

Use helpful labels for:

- الإمام ابن الجزري
- صاحب الكتاب
- صاحب الطريق
- الرواة المتوسطون
- الراوي
- القارئ / الإمام

These are structural labels, not necessarily additional people.

Do not force every chain to contain a separate صاحب الطريق node.

A person may hold more than one role.

The route name may refer to a historical transmitter already present elsewhere in the chain.

### Insertion Controls

Include:

- إضافة راوٍ
- إضافة راوٍ قبله
- إضافة راوٍ بعده
- حذف الراوي
- نقل لأعلى
- نقل لأسفل

Use searchable name selectors wherever possible.

---

# 8. Reusing Previously Entered Narrators

All narrator inputs should provide autocomplete.

For example, when typing:

**أبي الفتح**

Show matching saved names.

The user should be able to select the correct narrator rather than typing the complete name again.

When adding a missing name, provide a lightweight dialog asking only for:

**اسم الراوي بصيغة الجر**

Optionally allow entering a more familiar display name or alternative spelling.

Save the new person for later reuse.

A person should have one stable internal identity wherever practical.

Do not duplicate the person record for every chain.

---

# 9. Adding Many Ṭuruq Quickly

This is especially important.

Some users may want to enter dozens or hundreds of ṭuruq from the same book.

Provide these actions:

- **حفظ الطريق**
- **حفظ وإضافة طريق آخر**
- **نسخ طريق موجود**
- **إضافة طريق لنفس الرواية**
- **إضافة طريق لرواية أخرى**
- **إضافة إسناد آخر للكتاب**

### Save and Add Another

After saving a ṭarīq, allow the user to continue entering another one without returning to the beginning.

Keep:
- The selected book
- The selected author
- The selected book sanad
- The selected qirāʾah and riwāyah, where appropriate

Clear only the fields necessary for entering the next ṭarīq.

### Copy Existing Ṭarīq

Allow users to duplicate an existing chain as a starting point.

They can then change only the narrators that differ.

The copied chain must be saved as a new ṭarīq, not overwrite the original.

Reuse the same people records.

### Shared Chain Segments

Allow previously entered chain segments to be reused.

For example, if multiple routes share the same segment from Ibn al-Jazarī to the book author, do not require entering that segment repeatedly.

---

# 10. Complete Sanad Generation

The application should be capable of combining the selected book sanad with its riwāyah-specific ṭarīq.

Structure:

**الإمام ابن الجزري**

↓

His intermediate shuyūkh

↓

**صاحب الكتاب**

↓

Intermediate ṭarīq transmitters

↓

**الراوي**

↓

**الإمام صاحب القراءة**

When combining segments:

- Do not duplicate the book author.
- Preserve the correct narrator order.
- Do not invent missing narrators.
- Use the saved genitive forms when generating Arabic sanad text.
- Use «عن» as the connector between narrators.
- Do not automatically claim a chain is historically verified.

If the rawī-to-imam connection is already stored in the existing qirāʾāt data, reuse that verified relationship. Otherwise, show that segment as requiring confirmation rather than inventing it.

### Preview

Provide two previews:

**A. Visual preview**

Person → Person → Person → Person

**B. Text preview**

A formatted Arabic sanad using the stored names and «عن».

Keep the text readable and compatible with the current Asaneed style.

---

# 11. Manage Saved Books and Ṭuruq

Add a simple management view.

Users should be able to search for a book and open its saved records.

For each book, display:

- Book title
- Author
- Available book-sanad chains
- Qirāʾāt and riwāyāt
- Saved ṭuruq
- Number of routes
- Add new ṭarīq
- Edit relevant records

Avoid showing all chains fully expanded on the main listing.

Use collapsible sections or detail pages.

### Editing

Allow correcting:

- Book titles
- Author names
- Individual narrator names
- Chain order
- Ṭarīq names
- Riwāyah selection
- Book-sanad selection

Changes to shared people or book records must not unintentionally rewrite finalized historical certificates.

### Deletion

Allow deleting a ṭarīq with confirmation.

Before deleting a shared book, person, or sanad, check whether other records reference it.

Prefer safe archiving where deletion would break existing relationships.

---

# 12. Additional Shaykh Integration

The builder must work inside **المشايخ الإضافيون**.

When a user opens an additional-shaykh profile and chooses to add a sanad:

1. Allow selecting an existing book.
2. Allow creating a new book if necessary.
3. Allow selecting its sanad from Ibn al-Jazarī.
4. Select the qirāʾah and riwāyah.
5. Add the ṭarīq and narrator chain.
6. Save the sanad under that additional-shaykh profile.

The selected additional shaykh must be stored explicitly.

Do not infer the owner from a globally selected shaykh.

An additional shaykh may have multiple books, qirāʾāt, riwāyāt and ṭuruq.

Ensure existing additional-shaykh records continue working.

---

# 13. Normal Asaneed Integration

When opened from **أسانيدي / إدارة الأسانيد**, the same builder should allow adding new routes for the user's authorized sanad collection.

Do not create two separate implementations of the chain builder.

Use one shared component with the correct saving context.

The new ṭuruq should be available for authorized future certificate creation, while existing certificate behavior remains unchanged unless explicitly selected.

Do not automatically attach newly created ṭuruq to existing certificates.

---

# 14. Supabase Data Structure

Inspect the existing database before creating new tables.

Reuse existing `sanads`, `qiraat`, `riwayat`, and other suitable tables where possible.

Add only the necessary structured storage for:

- Books
- Book authors
- Reusable narrator identities
- Book-sanad chains
- Ordered chain narrators
- Riwāyah-specific ṭuruq
- Ownership and additional-shaykh associations

Each book should have a stable ID.

Each sanad and ṭarīq should have a stable ID.

Store ordered narrator references instead of relying on one unstructured text field.

Use foreign keys and appropriate indexes.

Preserve all existing legacy IDs.

Do not replace or destroy historical Asaneed records.

Enforce permissions through Supabase RLS and server-side checks.

Shared historical data should not provide unauthorized access to another user's private records.

---

# 15. Interface and Mobile Experience

Use the existing Asaneed design system.

Requirements:

- Arabic RTL
- Readex Pro
- Responsive mobile layout
- Compact input boxes
- Searchable narrator selectors
- Insert-between controls
- Clear stage indicators
- Save and Cancel actions
- Easy navigation between the two stages
- No unnecessary huge forms
- No emojis as interface icons

On mobile, use vertically stacked narrator boxes and compact controls.

On desktop, use a wider chain editor that remains readable.

Show a preview without forcing the user to leave the editing page.

---

# 16. What Not to Build Yet

Do not turn this feature into a full historical research database.

For now, do not require:

- Dates of birth
- Dates of death
- Biography entries
- Historical period classification
- Full teacher/student research
- Halaqah numbers
- Detailed manuscript references
- Complex narrator relationship graphs

These features can be added later.

The current priority is entering books, narrators and ṭuruq quickly and accurately.

---

# 17. Testing Requirements

Test the following workflows:

1. Add a new book.
2. Enter its author's name.
3. Enter the sanad from Ibn al-Jazarī to the author.
4. Save the book.
5. Return and select the saved book.
6. Add a second book sanad.
7. Select a qirāʾah and riwāyah.
8. Add a ṭarīq with multiple intermediate narrators.
9. Insert a narrator between two existing narrators.
10. Reuse an existing narrator through autocomplete.
11. Add a new narrator and reuse that person in another chain.
12. Save and add another ṭarīq.
13. Copy an existing ṭarīq.
14. Generate a complete sanad preview.
15. Use the builder for an additional shaykh.
16. Confirm ownership and permissions.
17. Verify existing asānīd and certificates are unchanged.
18. Confirm the interface works on mobile and desktop.

---

# 18. Implementation and Deployment

1. Inspect the existing repository and Supabase schema.
2. Identify the current sanad and additional-shaykh components.
3. Design the minimal necessary database changes.
4. Back up affected data.
5. Implement the shared two-stage builder.
6. Implement autocomplete and reusable book records.
7. Add full sanad previews.
8. Integrate with normal asānīd and additional shaykhs.
9. Run type checks and available tests.
10. Commit changes to GitHub.
11. Deploy to the existing Vercel project.
12. Verify the live application.

Do not overwrite the database or recreate the application.

Ask for approval before destructive or irreversible operations.

## Final Goal

Make Asaneed capable of conveniently storing **many books, their transmission asānīd from Ibn al-Jazarī, and numerous riwāyah-specific ṭuruq**, with minimal repeated typing.

The user should enter a book and its author once, save the book sanad, then continuously add ṭuruq for different riwāyāt.

Everything should work inside the existing Asaneed application, including **المشايخ الإضافيون**, and remain reusable for future ijazah preparation.
