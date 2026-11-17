# Project coding and design standards

These standards apply to work in this repository and are intended to keep the project understandable and maintainable.

## Code

- Prefer straightforward, readable solutions over clever or overly abstract code.
- Use names that explain what a variable, function or file is responsible for.
- Keep functions focused and avoid unnecessary layers, dependencies or frameworks.
- Add comments when they explain a decision or a non-obvious behaviour, not to narrate every line.
- Handle loading, empty and error states instead of assuming every request succeeds.
- Keep credentials and private configuration out of client-side code and Git history.
- Preserve existing working behaviour unless a change is needed and explained.

## Interface

- Design for small screens first, then make good use of wider layouts.
- Keep typography, spacing, controls and colours consistent across pages.
- Support keyboard use, visible focus states and useful labels.
- Respect reduced-motion preferences and avoid decorative motion that gets in the way.
- Make light and dark themes both deliberate, readable designs.

## Documentation

- Keep the README aligned with the actual code and deployment setup.
- Explain external services, attribution requirements and known limitations.
- Avoid claiming that a feature is live, forecast-based or guaranteed unless its data source supports that claim.
