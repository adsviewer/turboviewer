# Pull Request Naming Guidelines

Generally pull request naming is pretty simple and a bit loose.

_Note every rule is meant to be broken, these are general guidelines._

## Ticket Linked PR

The expectation is that the ticket manager's ticket id should always be included first followed by a colon.

For example `AV-<number>: <Title>` is acceptable for ticket linked issues.

Generally most changes should have a change, but it's not required for quick last minute fixes and things that are hard to ticket.

## Title naming

Titles always need to be descriptive of the changes and never redundant.

For example `bugfixes/fixed frontend` is a bad pr. This tells no one anything about what the pr is about.

PR titles should also never have platforms included. We have autolabelers that already assign tags for that exact reason to filter on.

Finally, PR titles should never include the authors name, that's already included in the pr's author data.

## Reviews

In general, always choose folks in your team to review your code. Code being directly pushed or merged should be reserved only for special occasions.

