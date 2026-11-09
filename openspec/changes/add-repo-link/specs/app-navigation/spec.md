# Spec Delta

## ADDED Requirements

### Requirement: Source repository link
The sidebar SHALL show a link to the app's source repository at `https://github.com/vienhx/dev-utils`, below the tool list, in the full sidebar, the collapsed rail and the mobile drawer. In the rail the link SHALL show only an icon and SHALL still have the accessible name "GitHub repository". The link SHALL open in a new tab and SHALL NOT send a referrer.

#### Scenario: Link in expanded sidebar
- **WHEN** the user opens the app at 1440 px wide with the sidebar expanded
- **THEN** the sidebar shows a "GitHub" link below the tools pointing to `https://github.com/vienhx/dev-utils`

#### Scenario: Link in collapsed rail
- **WHEN** the sidebar is collapsed to the rail
- **THEN** an icon-only link named "GitHub repository" points to `https://github.com/vienhx/dev-utils`

#### Scenario: Link in mobile drawer
- **WHEN** at 375 px wide the user opens the drawer
- **THEN** the drawer shows the "GitHub" link pointing to `https://github.com/vienhx/dev-utils`

#### Scenario: Opens in a new tab without referrer
- **WHEN** the user activates the link
- **THEN** the repository opens in a new tab, the app stays open in the current tab, and no referrer is sent
