# Ralph Agent Instructions

## Your Task

1. Read `scripts/ralph/prd.json`
2. Read `scripts/ralph/progress.txt`
   (check Codebase Patterns first)
3. Check you're on the correct branch
4. Pick highest priority story 
   where `passes: false`
5. Implement that ONE story
6. Browser Testing (for UI changes)
   - Use the dev-browser skill
   - Start dev server if needed
   - Navigate to affected pages
   - Take screenshots for verification
   - Verify visual changes match requirements
7. Run typecheck and tests
8. Update AGENTS.md files with learnings
9. Commit: `feat: [ID] - [Title]`
10. Update prd.json: `passes: true`
11. Append learnings to progress.txt

## Progress Format

APPEND to progress.txt:

## [Date] - [Story ID]
- What was implemented
- Files changed
- **Learnings:**
  - Patterns discovered
  - Gotchas encountered
---

## Browser Testing Details

For UI-related stories, verify changes visually:

1. Ask user to start dev-browser with:
   "Go to [URL] and take a screenshot"

2. I'll use the dev-browser skill automatically
   (no manual server.sh or scripts needed)

3. Verify screenshot matches acceptance criteria

4. Not complete until visually verified

## Codebase Patterns

Add reusable patterns to the TOP
of progress.txt:

## Codebase Patterns
- Migrations: Use IF NOT EXISTS
- React: useRef<Timeout | null>(null)

## Stop Condition

If ALL stories pass, reply:
<promise>COMPLETE</promise>

Otherwise end normally.