# PBI: [Short Descriptive Title]

## User Statement

Como **[user role]**, Eu quero **[goal or action]**, para **[benefit or outcome]**.

> Example: As a contractor using the Claims Portal, I want part descriptions to match what is shown in the main application, so that the information I see is consistent and reflects a single source of truth.

---

## Context

> Provide background on why this PBI exists. Reference any related feature, initiative, or standardization effort it belongs to.

[Describe the current state and the problem it causes. Reference any parent Feature or related PBI if applicable, e.g., "As part of Feature #XXXX — [Title], this PBI addresses the [specific scope] portion of the broader change."]

---

## Backend Scope

- [Specific backend task — e.g., audit endpoints, update response fields, add/modify data transformation logic.]
- [Specific backend task — e.g., define and implement a fallback for missing or null data.]
- [Specific backend task — e.g., ensure a new field is exposed in the API contract.]

> Example entries:
> - Audit all relevant API endpoints that return [data type] and identify which field is currently being exposed.
> - Update responses to return [new/correct field] in place of [old field].
> - Define and implement a graceful fallback (e.g., [fallback field]) for cases where [primary field] is absent or null.

---

## Frontend Scope

- [Specific frontend task — e.g., update views to read and render the new field.]
- [Specific frontend task — e.g., remove logic that reads the deprecated field.]
- [Specific frontend task — e.g., ensure fallback value renders correctly in the UI.]

> Example entries:
> - Update all [view/component names] that display [data type] to read and render [new field].
> - Remove any logic that reads [deprecated field(s)] for display purposes.
> - Ensure the fallback value is displayed correctly when [primary field] is absent.

---

## Out of Scope

> Use this section to explicitly state what this PBI does NOT cover, to prevent scope creep and set clear boundaries.

- [Related change that belongs to a different PBI or team.]
- [Behavior or functionality intentionally excluded from this work.]

---

## Definition of Done
> Use this section to explicity state the set of Definition of Done criteria that a product increment must meet for the team to consider it complete and ready for customers. The DoD is a set of high-level criteria that defines when a product increment is complete. It ensures the quality and consistency of a deliverable. 

- [Specific testing DoD — e.g., All code has been thoroughly tested via unit, integration, and end-to-end tests.]
- [Specific Criterias — e.g., All images are compressed.]
- [Specific Quality Definitions — e.g., All errors and bugs have been resolved and retested]
- [Specific Acceptance criteria — e.g., All Acceptance criteria have been met]

---


## Acceptance Criteria

> Add this section inside the Field Name:Acceptance Criteria inside the Feature in Azure devops
> Write each scenario in Gherkin-style format: **Given / When / Then / And**. Each scenario should be independently testable.

### Scenario 1: [Happy path — primary behavior works as expected]

**Given** [initial context or state]  
**When** [action or trigger]  
**Then** [expected result]  
**And** [additional condition or assertion, if needed]

---

### Scenario 2: [Variant — secondary or related view/component]

**Given** [initial context or state]  
**When** [action or trigger]  
**Then** [expected result]  
**And** [additional condition or assertion, if needed]

---

### Scenario 3: [Edge case — fallback, empty state, or missing data]

**Given** [data is missing, null, or incomplete]  
**When** [the UI or API attempts to render or return the data]  
**Then** [fallback behavior is applied]  
**And** [no error, crash, or empty display occurs]

---

### Scenario 4: [Regression — no existing functionality is broken]

**Given** [the change has been applied]  
**When** [a user performs normal actions in the affected area]  
**Then** [all existing functionality continues to work correctly]  
**And** [no data is lost, hidden, or inaccessible as a result of the change]
