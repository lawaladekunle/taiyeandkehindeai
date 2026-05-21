# Code Review Guidelines

**Document Version:** 1.0  
**Last Updated:** 2026-05-21  
**Owner:** CTO  
**Status:** Active

## Purpose

This document provides detailed guidelines for conducting effective code reviews that maintain code quality, share knowledge, and foster a collaborative engineering culture.

## Code Review Philosophy

### Goals of Code Review

1. **Code Quality:** Catch bugs, security issues, and performance problems early
2. **Knowledge Sharing:** Spread domain knowledge and best practices across the team
3. **Consistency:** Ensure code follows team standards and conventions
4. **Mentorship:** Help junior developers learn and grow
5. **Collaboration:** Foster teamwork and collective code ownership

### Code Review Mindset

- **Be constructive:** Provide actionable, specific feedback
- **Be respectful:** Critique code, not people
- **Be curious:** Ask questions instead of making demands
- **Be helpful:** Suggest solutions, not just problems
- **Be humble:** Everyone makes mistakes; reviews are learning opportunities

## Before Submitting a Pull Request

### Self-Review Checklist

- [ ] **Code Compiles:** Code builds without errors or warnings
- [ ] **Tests Pass:** All tests pass locally
- [ ] **Self-Review Completed:** Reviewed your own code first
- [ ] **Documentation Updated:** README, API docs, comments updated
- [ ] **Standards Compliant:** Follows coding standards and style guides
- [ ] **Commit Messages:** Follow conventional commits format
- [ ] **Branch Updated:** Branch is up-to-date with target branch
- [ ] **Debug Code Removed:** No console.log, debug.print, or TODOs
- [ ] **Secrets Removed:** No API keys, passwords, or tokens
- [ ] **Performance Considered:** No obvious performance issues

### PR Description Template

```markdown
## Summary
Brief description of what this PR does and why.

## Ticket
- Closes TAI-XXX
- Related to TAI-YYY

## Changes
- List of specific changes made
- Another important change

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed
- [ ] Performance tests run

## Screenshots (if applicable)
Include before/after screenshots for UI changes.

## Deployment Notes
Any special deployment considerations or migrations needed.

## Checklist
- [ ] Self-review completed
- [ ] Code standards followed
- [ ] Tests added/updated
- [ ] Documentation updated
```

## During Code Review

### Review Priorities

1. **Security Issues** 🔴
   - Potential vulnerabilities
   - Data exposure risks
   - Authentication/authorization problems
   - Input validation gaps

2. **Logical Errors** 🔴
   - Bugs that cause incorrect behavior
   - Race conditions
   - Off-by-one errors
   - Null reference exceptions

3. **Performance Issues** 🟡
   - Inefficient algorithms
   - Memory leaks
   - Database N+1 queries
   - Scalability concerns

4. **Code Quality** 🟡
   - Readability and maintainability
   - Code duplication
   - Complex logic without comments
   - Inconsistent naming

5. **Style and Conventions** 🟢
   - Formatting issues
   - Naming conventions
   - Minor style deviations

### What to Look For

#### Functional Correctness
- Does the code do what it's supposed to do?
- Are all edge cases handled?
- Are error conditions properly managed?
- Are there any obvious bugs?

#### Security
- Is user input properly validated and sanitized?
- Are authentication and authorization checks in place?
- Are secrets and credentials handled securely?
- Is sensitive data properly encrypted?
- Are there any injection vulnerabilities?

#### Performance
- Are there any obvious performance bottlenecks?
- Are database queries efficient?
- Is caching used appropriately?
- Are resources properly managed?

#### Code Quality
- Is the code readable and maintainable?
- Are variable and function names clear?
- Is the code properly organized?
- Is there unnecessary complexity?
- Is code duplication avoided?

#### Testing
- Are there adequate tests?
- Do tests cover both success and failure cases?
- Are edge cases tested?
- Are tests clear and maintainable?

#### Documentation
- Is the code self-documenting where possible?
- Are complex algorithms explained?
- Is public API documentation complete?
- Are there code examples?

### Review Techniques

#### 1. Understand the Context
- Read the ticket or user story
- Understand the problem being solved
- Check related PRs or documentation
- Ask clarifying questions if needed

#### 2. Review in Layers
1. High-level architecture and design
2. Class/component structure and interactions
3. Method/function implementation
4. Line-by-line code quality

#### 3. Use Review Tools
- Use GitHub's review features (comments, approvals, requests)
- Suggest code changes for minor fixes
- Use code navigation to understand context
- Check test coverage reports

#### 4. Test the Code
- Pull the branch locally
- Run the tests
- Test the functionality manually
- Check performance impact

## Writing Review Comments

### Good Comment Examples

**Constructive and Specific:**
```
❌ Bad: "This is wrong"
✅ Good: "This could cause a null pointer exception if user is null. 
Consider adding a null check or using Optional."
```

**Educational:**
```
❌ Bad: "Use a different data structure"
✅ Good: "A HashMap would provide O(1) lookup here instead of O(n), 
which would improve performance for larger datasets."
```

**Respectful:**
```
❌ Bad: "I can't believe you wrote this"
✅ Good: "This logic is a bit hard to follow. Could we break it into 
smaller functions with descriptive names?"
```

**Actionable:**
```
❌ Bad: "This needs improvement"
✅ Good: "Consider extracting this validation logic into a separate 
method like validateUserInput() for better reusability."
```

### Comment Template

```
**[Type]:** [Brief description]

**Why:** [Explanation of the issue and its impact]

**Suggestion:** [Specific actionable suggestion]

**Reference:** [Link to documentation or example if applicable]
```

## Handling Different Types of PRs

### Small vs. Large PRs

**Small PRs (< 200 lines):**
- Quick review (15-30 minutes)
- Can often approve or request minor changes
- Focus on overall correctness

**Medium PRs (200-500 lines):**
- Thorough review (30-60 minutes)
- Check for design patterns and architecture
- Verify test coverage

**Large PRs (> 500 lines):**
- Break into multiple review sessions
- Focus on high-level architecture first
- Request breaking into smaller PRs if possible
- Consider pair review with another team member

### Bug Fixes
- Verify the bug is actually fixed
- Check for side effects
- Verify tests cover the bug scenario
- Consider performance impact

### New Features
- Verify requirements are met
- Check for completeness
- Verify error handling
- Review user experience

### Refactoring
- Verify behavior hasn't changed
- Check for performance regression
- Verify tests still pass
- Review for improved readability

## Reviewer Responsibilities

### Ethics and Professionalism

- **Maintain Confidentiality:** Don't share code or review details externally
- **Avoid Bias:** Review based on technical merit, not personal relationships
- **Respect Time:** Provide timely reviews and feedback
- **Continuous Learning:** Keep skills current and share knowledge
- **Constructive Criticism:** Focus on improvement, not blame

### Accountability

- **Take Time:** Don't rush reviews; quality over speed
- **Be Thorough:** Don't just skim code; understand it
- **Ask Questions:** Clarify when you don't understand
- **Follow Up:** Check that feedback is addressed
- **Admit Mistakes:** It's okay to miss things or be wrong

## Author Responsibilities

### Receiving Feedback

- **Don't Take It Personally:** Comments are about code, not you
- **Ask for Clarification:** If feedback is unclear, ask
- **Learn from Feedback:** Use reviews as learning opportunities
- **Be Open to Suggestions:** Consider alternative approaches
- **Acknowledge Mistakes:** Everyone makes them

### Responding to Feedback

- **Address All Comments:** Respond to every comment
- **Explain Your Reasoning:** If you disagree, explain why
- **Make Changes:** Implement valid suggestions
- **Push Back Respectfully:** It's okay to disagree constructively
- **Follow Up:** Let reviewers know when you've made changes

### PR Updates

- **Single Commit:** Squash commits for simple changes
- **Rebase:** Keep branch up-to-date with target branch
- **Address Comments:** Make changes in response to feedback
- **Don't Force Push:** After initial review, add commits instead

## Common Code Review Scenarios

### When to Request Changes

Request changes for:
- Security vulnerabilities
- Logical bugs
- Performance issues
- Missing tests for critical paths
- Breaking existing functionality
- Not meeting requirements

### When to Comment (Not Block)

Comment for:
- Style suggestions
- Alternative approaches
- Minor improvements
- Questions for clarification
- Future considerations

### When to Approve

Approve when:
- Code meets requirements
- No blocking issues
- Minor issues can be addressed later
- Overall quality is acceptable
- No security or performance concerns

### When to Escalate

Escalate to engineering manager when:
- Major disagreement on approach
- Repeated review cycles without resolution
- Scope creep or requirement changes
- Technical debt concerns
- Resource or timeline conflicts

## Review Metrics

### Tracking Review Effectiveness

**Metrics to Monitor:**
- Average review turnaround time
- Number of review cycles per PR
- Comment-to-approval ratio
- Post-merge bug rate
- Reviewer participation rate

**Goals:**
- First review within 4 hours
- 95% of PRs approved within 24 hours
- < 10% of PRs need > 2 review cycles
- < 5% post-merge bug rate

## Tools and Automation

### Automated Checks

**Required Automation:**
- Code formatting (Prettier, Black, etc.)
- Linting (ESLint, Pylint, etc.)
- Static analysis (SonarQube, CodeClimate)
- Security scanning (Snyk, Dependabot)
- Test execution and coverage

### Manual Checks

**Still Require Human Review:**
- Architectural decisions
- Algorithm correctness
- User experience
- Performance implications
- Security vulnerabilities
- Business logic accuracy

## Language-Specific Guidelines

### Code Review Checklists by Language

#### Python
- [ ] Follows PEP 8 style guide
- [ ] Uses type hints
- [ ] Handles exceptions appropriately
- [ ] No mutable default arguments
- [ ] Uses context managers for resources
- [ ] Follows EAFP principle where appropriate

#### JavaScript/TypeScript
- [ ] Uses TypeScript for type safety
- [ ] Handles async operations properly
- [ ] No console.log statements
- [ ] Proper error handling
- [ ] Follows functional programming principles
- [ ] No unnecessary dependencies

#### C#
- [ ] Follows .NET naming conventions
- [ ] Proper use of async/await
- [ ] IDisposable implemented where needed
- [ ] Extension methods in appropriate namespaces
- [ ] Null reference checks
- [ ] Proper exception handling

#### Java
- [ ] Follows Java naming conventions
- [ ] Proper use of streams
- [ ] Resource management (try-with-resources)
- [ ] Final variables where appropriate
- [ ] Proper use of Optional
- [ ] No raw types

## Emergency Procedures

### Hotfix Process

1. **Create hotfix branch from main**
2. **Make minimal changes to fix issue**
3. **Get expedited review (skip some checks if necessary)**
4. **Deploy immediately after approval**
5. **Follow up with proper fix in develop branch**
6. **Document lessons learned**

### Security Vulnerability Process

1. **Immediate triage and assessment**
2. **Confidential communication (security team)**
3. **Expedited fix development**
4. **Thorough but expedited review**
5. **Emergency deployment**
6. **Post-incident review**

---

**Document History:**
- Version 1.0 (2026-05-21): Initial release

**Approval:**
- CTO: _____________________ Date: ___________
- Engineering Manager: _____________________ Date: ___________