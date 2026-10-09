# Contributing to AgriConnect

Use one integrated repository. Each member should commit actual changes and review notes using their own GitHub Desktop account and Git identity. The prepared baseline is AI-assisted; an import commit is not a claim of each member's independent implementation.

## Approved responsibility allocation

| Member | Responsibilities |
|---|---|
| DEWRANGA K K — IT23643390 | Buyer discovery, details, saved/compare, basket, checkout, orders and reviews |
| PRABHASHWARA S N — IT23661660 | Farmer listings, order preparation and verification requests |
| PERERA P A L R — IT23665934 | Rider jobs, assignment and delivery progress |
| SEYON S — IT23676442 | Accounts, profiles and support shared by all three roles |

This is the group representative's approved allocation. It does not verify individual authorship. Each member must understand and demonstrate the interfaces and CRUD operations in their area.

## Each teammate's workflow

1. Accept the repository invitation, then clone the repository in their own GitHub Desktop.
2. Use **File → Options → Git** to check their own name and an email linked to their own GitHub account. Do not substitute another person's identity.
3. Fetch/pull the latest changes and select the repository's default branch.
4. Run the app and try their assigned features. Make a real correction or improvement if needed. If documenting a review, record the actual task, observed outcome, device/date and relevant source function in a Markdown note; describe it as a review rather than original implementation.
5. Inspect the actual diff, enter a message describing the work performed, commit and push. Coordinate before editing shared `app.js` or `domain.js` files.
6. Open History and inspect the saved commit. The repository owner can then inspect the combined GitHub history.

For the group walkthrough, use one device: buyer creates an order; farmer makes it ready; rider delivers and records cash collection; buyer reads the result. Each role should also demonstrate its assigned working CRUD operations. The main service suite and the member CRUD test source provide the expected behaviour.

## Display the actual history

GitHub Desktop's **History** tab displays the saved commits. In the GitHub repository, open the commits view for the default branch to see the published history. The read-only helper can print it locally:

```powershell
.\tests\show-history.ps1
```

It lists real stored commits and author totals. It does not create commits, change authors, alter dates or generate contribution claims. Commit counts alone do not establish implementation quality or satisfy the individual viva.

GitHub documentation: [Git configuration in Desktop](https://docs.github.com/en/desktop/configuring-and-customizing-github-desktop/configuring-basic-settings-in-github-desktop) and [sharing an existing project](https://docs.github.com/en/desktop/adding-and-cloning-repositories/adding-an-existing-project-to-github-using-github-desktop).
