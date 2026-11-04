# app-navigation Specification

## Purpose

Provides the app shell and sidebar for moving between tools and opening each tool's saved templates, on both desktop and mobile.

## Requirements

### Requirement: Sidebar lists tools
The app SHALL show a sidebar listing every available tool by name and icon. The tool currently open SHALL be visually highlighted. Clicking a tool SHALL open it.

#### Scenario: Chain listed and active
- **WHEN** the user opens the app with the Chain tool showing
- **THEN** the sidebar lists "Chain" and it is highlighted as the active tool

#### Scenario: Open tool from sidebar
- **WHEN** the user clicks "Chain" in the sidebar
- **THEN** the Chain tool is shown and the URL is `#/chain`

### Requirement: Templates nested under their tool
Each tool entry SHALL list that tool's saved templates beneath it, newest first, in a section the user can expand or collapse. The expanded state of each tool SHALL be remembered across reloads.

#### Scenario: Templates under Chain
- **WHEN** the user has saved Chain templates `A` and then `B`
- **THEN** both appear nested under "Chain" with `B` above `A`

#### Scenario: Collapse tool section
- **WHEN** the user collapses the Chain section and reloads the page
- **THEN** the Chain section is still collapsed and its templates are hidden

#### Scenario: No templates hint
- **WHEN** no Chain templates exist and the Chain section is expanded
- **THEN** a short hint under Chain explains that saved chains appear there

### Requirement: Open template from sidebar
Clicking a template in the sidebar SHALL open its tool and load the template into it, while the current input text is kept.

#### Scenario: Click template on another screen
- **WHEN** the user clicks the template `B64 to JSON` in the sidebar
- **THEN** the Chain tool is shown with that template's steps loaded and the input text unchanged

### Requirement: Collapsible sidebar on desktop
On viewports at least 768 px wide, the user SHALL be able to collapse the sidebar to a narrow icon rail and expand it again. The collapsed state SHALL be remembered across reloads. In the rail, templates SHALL be reachable from a flyout list on the tool's icon.

#### Scenario: Collapse to rail
- **WHEN** the user clicks the collapse control
- **THEN** the sidebar shrinks to an icon rail and the tool content widens

#### Scenario: Collapsed state persists
- **WHEN** the sidebar is collapsed and the user reloads the page
- **THEN** the sidebar is still collapsed

#### Scenario: Template from rail flyout
- **WHEN** the sidebar is collapsed and the user hovers or focuses the Chain icon
- **THEN** a flyout lists Chain's templates and clicking one loads it

### Requirement: Drawer on mobile
On viewports narrower than 768 px, the sidebar SHALL be hidden behind a menu button and open as an overlay drawer. The drawer SHALL close when the user picks a tool or template, taps outside it, or presses Escape.

#### Scenario: Open and pick from drawer
- **WHEN** at 375 px wide the user taps the menu button and then taps a template
- **THEN** the drawer closes and Chain shows with that template loaded

#### Scenario: Dismiss drawer
- **WHEN** the drawer is open and the user taps outside it or presses Escape
- **THEN** the drawer closes without changing the current tool

### Requirement: URL routes per tool
Each tool SHALL have its own hash route. An empty or unknown route SHALL show the default tool (Chain). Browser back and forward SHALL move between visited tools.

#### Scenario: Root URL
- **WHEN** the user opens the site with no hash
- **THEN** the Chain tool is shown and the URL becomes `#/chain`

#### Scenario: Unknown route
- **WHEN** the user opens `#/does-not-exist`
- **THEN** the Chain tool is shown and the URL becomes `#/chain`

### Requirement: Template link route
The route `#/chain?template=<id>` SHALL open Chain and load the template with that id once, then replace the URL with `#/chain`. An unknown id SHALL show Chain unchanged with a "template not found" message.

#### Scenario: Open template by link
- **WHEN** the user opens `#/chain?template=<id>` for an existing template
- **THEN** that template is loaded and the URL becomes `#/chain`

#### Scenario: Unknown template id
- **WHEN** the user opens `#/chain?template=missing`
- **THEN** Chain is shown with its current chain unchanged and a "template not found" message

### Requirement: Keyboard accessible navigation
All sidebar controls SHALL be reachable and operable with the keyboard. The template list and the collapse control SHALL expose their expanded state to assistive technology.

#### Scenario: Keyboard navigation
- **WHEN** the user tabs into the sidebar and presses Enter on a template
- **THEN** that template is loaded into Chain
