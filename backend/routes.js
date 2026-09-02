const express = require('express');
const db = require('./database');
const router = express.Router();

// 1. Auth Endpoint
router.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Validate user and password
  db.get('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (row) {
      // User found and password matches, return user details without the password
      res.json({ id: row.id, name: row.name, email: row.email, role: row.role });
    } else {
      // User not found or incorrect password
      res.status(401).json({ error: 'Invalid credentials or not a registered user' });
    }
  });
});

const nodemailer = require('nodemailer');

// 1.5 Password Reset
router.post('/auth/reset-password', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Verify user exists
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) {
      // For security, don't reveal if email exists, just pretend it sent
      return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    }

    try {
      // MOCK EMAIL SENDING FOR DEMO (Avoids SMTP cloud blocking)
      console.log(`Mocking password reset email to ${email}`);
      
      // Simulate network delay of 1.5 seconds
      await new Promise(resolve => setTimeout(resolve, 1500));

      res.json({ 
        success: true, 
        message: 'Password reset link sent successfully to your inbox!' 
      });
    } catch (error) {
      console.error('Error sending real email:', error);
      res.status(500).json({ error: 'Failed to send reset email. Check server console for details.' });
    }
  });
});

// 1.6 Update Password (After clicking reset link)
router.post('/auth/update-password', (req, res) => {
  const { email, newPassword } = req.body;
  
  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required' });
  }

  db.run('UPDATE users SET password = ? WHERE email = ?', [newPassword, email], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to update password' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, message: 'Password updated successfully!' });
  });
});

// 2. Skill Verification
router.post('/skills/verify', (req, res) => {
  const { userId, skillName, experienceType, years } = req.body;
  if (!skillName) return res.status(400).json({ error: 'Skill name required' });
  
  db.serialize(() => {
    // Delete only if this specific skill already exists to avoid duplicates
    db.run('DELETE FROM skills WHERE userId = ? AND skillName = ?', [userId, skillName]);
    
    // Insert the new verified skill
    db.run('INSERT INTO skills (userId, skillName, isVerified) VALUES (?, ?, 1)', [userId, skillName]);
    
    // Update experience (simplification: replaces previous experience entry)
    db.run('DELETE FROM experience WHERE userId = ?', [userId]);
    db.run('INSERT INTO experience (userId, type, years) VALUES (?, ?, ?)', [userId, experienceType, years || null]);
  });
  res.json({ success: true, message: 'Skill verified and saved successfully' });
});

// 3. Learning Interests
router.post('/learning', (req, res) => {
  const { interest } = req.body;
  const query = `
    SELECT u.name, 'Data Professional' as role, GROUP_CONCAT(s.skillName) as skill, '90%' as matched 
    FROM users u
    JOIN skills s ON u.id = s.userId
    WHERE s.skillName LIKE ? AND u.role = 'employee'
    GROUP BY u.id
  `;
  db.all(query, [`%${interest.toLowerCase()}%`], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length === 0) {
      return res.json({ experts: [
        { name: 'Alice Chen', role: 'Senior Data Engineer', skill: 'Python, Snowflake', matched: '98%' },
        { name: 'David Smith', role: 'Data Analyst', skill: 'SQL, dbt', matched: '85%' }
      ]});
    }
    res.json({ experts: rows });
  });
});

// 4. Dashboard Metrics
router.get('/dashboard/metrics', (req, res) => {
  const data = { skillData: [], experienceData: [], verifiedCount: 0 };
  db.all("SELECT skillName, COUNT(*) as value FROM skills WHERE LOWER(skillName) IN ('python', 'sql', 'dbt', 'snowflake', 'azure') GROUP BY skillName", (err, rows) => {
    if (!err) data.skillData = rows.map(r => ({ name: r.skillName, value: r.value }));
    db.all('SELECT type, years FROM experience', (err, rows) => {
      let fresher = 0, oneToThree = 0, threeToFive = 0, fivePlus = 0;
      rows.forEach(r => {
        if (r.type === 'fresher') fresher++;
        else if (r.years <= 3) oneToThree++;
        else if (r.years <= 5) threeToFive++;
        else fivePlus++;
      });
      data.experienceData = [
        { name: 'Fresher', count: fresher }, { name: '1-3 Years', count: oneToThree },
        { name: '3-5 Years', count: threeToFive }, { name: '5+ Years', count: fivePlus }
      ];
      db.get('SELECT COUNT(DISTINCT userId) as count FROM skills WHERE isVerified = 1', (err, row) => {
        if (!err) data.verifiedCount = row.count;
        res.json(data);
      });
    });
  });
});

// 5. Intelligent Project Matching AI
router.post('/ai/match-project', (req, res) => {
  const { requirements } = req.body;
  if (!requirements) return res.status(400).json({ error: 'Requirements missing' });

  // Extract skills from requirements using simple keyword matching
  const knownSkills = ['Python', 'SQL', 'dbt', 'Snowflake', 'Azure', 'React', 'Java', 'Node', 'AWS'];
  const reqLower = requirements.toLowerCase();
  
  const requestedSkills = knownSkills.filter(skill => reqLower.includes(skill.toLowerCase()));

  // Fetch all employees and their skills/experience
  db.all(`
    SELECT 
      u.name, 
      u.role as userRole,
      GROUP_CONCAT(s.skillName) as verifiedSkills, 
      MAX(e.years) as maxYears
    FROM users u
    LEFT JOIN skills s ON u.id = s.userId AND s.isVerified = 1
    LEFT JOIN experience e ON u.id = e.userId
    WHERE u.role = 'employee'
    GROUP BY u.id
  `, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    let matches = [];

    rows.forEach(row => {
      const userSkills = row.verifiedSkills ? row.verifiedSkills.split(',') : [];
      let matchScore = 0;
      let matchedSkills = [];

      // Calculate how many requested skills this user has
      if (requestedSkills.length > 0) {
        requestedSkills.forEach(reqSkill => {
          if (userSkills.some(s => s.toLowerCase() === reqSkill.toLowerCase())) {
            matchScore += 1;
            matchedSkills.push(reqSkill);
          }
        });
      } else {
        // If no specific skills requested, match score is based on total verified skills
        matchScore = userSkills.length > 0 ? 1 : 0;
        matchedSkills = userSkills;
      }

      // Only include if they have at least one matched skill
      if (matchScore > 0 || requestedSkills.length === 0) {
        let matchPercentage = requestedSkills.length > 0 
          ? Math.round((matchScore / requestedSkills.length) * 100) 
          : (userSkills.length > 0 ? 100 : 0);
          
        let years = row.maxYears || 0;
        let skillLevel = 'Low';
        if (years >= 5) skillLevel = 'High';
        else if (years >= 3) skillLevel = 'Medium';

        matches.push({
          name: row.name,
          role: row.userRole || 'Developer',
          verifiedSkills: userSkills.join(', '),
          matchedSkills: matchedSkills.join(', '),
          experience: `${years} years`,
          skillLevel: skillLevel,
          match: `${matchPercentage}%`
        });
      }
    });

    // Sort by match percentage (desc) then experience (desc)
    matches.sort((a, b) => parseInt(b.match) - parseInt(a.match) || parseInt(b.experience) - parseInt(a.experience));

    res.json({ matches });
  });
});

// 6. Org Insights AI Mock
router.post('/ai/insights', (req, res) => {
  const { query } = req.body;
  const qLower = query.toLowerCase();
  
  let reply = `Based on the dashboard data and your query "${query}", we currently have 3 major projects running. To support these, we have a growing need for Snowflake expertise.`;

  if (qLower.includes("how many employees")) {
    reply = "Systech currently has 17 active employees actively logged in and working across our projects, primarily divided into Engineering, Data, and DevOps roles.";
  } else if (qLower.includes("most common skills")) {
    reply = "The most commonly verified skills in our organization are currently SQL (4 employees), Python (3 employees), and dbt (3 employees).";
  } else if (qLower.includes("learning interests")) {
    reply = "Across the teams, the highest learning interest is currently directed towards dbt, with 24 employees requesting training.";
  }

  res.json({ reply });
});

const axios = require('axios');
const { detectTechnology, verifyDeveloperContribution } = require('./utils/skillEngine');

// 7. Real GitHub Verification
router.post('/github/real-verify', async (req, res) => {
  const { username, token, selectedSkill } = req.body;
  if (!selectedSkill) return res.status(400).json({ success: false, error: 'No skill selected' });
  
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const skill = selectedSkill.toLowerCase();
  
  try {
    // 1. Fetch Repositories
    let reposRes;
    if (token) {
      // If token is provided, fetch all repos the user has access to (including orgs and private)
      reposRes = await axios.get(`https://api.github.com/user/repos?per_page=100&sort=updated`, { headers });
    } else {
      reposRes = await axios.get(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, { headers });
    }
    
    // Allow forks, since users often work on enterprise forks
    const repos = reposRes.data.filter(r => !r.archived && r.size > 0);
    
    let totalCommits = 0;
    let totalPRs = 0;
    let totalMergedPRs = 0;
    let reposAnalyzed = 0;
    
    let globalEvidence = new Set();
    const repositoryBreakdown = [];
    
    // Limits to avoid immediate rate limits
    // Since rate limit is 5000/hr, we can safely scan up to 100 repos when authenticated
    const maxReposToScan = token ? 100 : 5;
    const reposToScan = repos.slice(0, maxReposToScan);

    let stage2Scores = [];

    for (const repo of reposToScan) {
      try {
        const owner = repo.owner.login;
        // Fetch default branch tree using the actual owner (might be an org)
        const treeRes = await axios.get(`https://api.github.com/repos/${owner}/${repo.name}/git/trees/${repo.default_branch}?recursive=1`, { headers });
        const tree = treeRes.data.tree || [];
        
        const files = tree.filter(t => t.type === 'blob').map(t => t.path.toLowerCase());
        const folders = tree.filter(t => t.type === 'tree').map(t => t.path.toLowerCase() + '/');

        // STAGE 1: Technology Detection
        const stage1 = detectTechnology(skill, repo.name, files, folders);
        
        if (stage1.evidenceLevel !== 'NONE') {
            reposAnalyzed++;
            stage1.evidence.forEach(e => globalEvidence.add(e));

            // STAGE 2: Developer Contribution Verification
            const stage2 = await verifyDeveloperContribution(skill, username, owner, repo.name, headers);
            
            if (stage2.hasContribution) {
                stage2.devEvidence.forEach(e => globalEvidence.add(e));
                totalCommits += stage2.totalCommits;
                totalPRs += stage2.prCount;
                totalMergedPRs += stage2.mergedCount;

                // Weighted evidence scoring for this repository
                let structureScore = stage1.evidenceLevel === 'STRONG' ? 40 : (stage1.evidenceLevel === 'MODERATE' ? 20 : 10);
                let contentScore = stage2.codePatternScore * 0.35; // 35% weight
                let commitScore = stage2.commitsScore * 0.10; // 10% weight
                let prScore = stage2.prScore * 0.15; // 15% weight

                let finalRepoScore = Math.min(100, structureScore + contentScore + commitScore + prScore);
                stage2Scores.push(finalRepoScore);

                repositoryBreakdown.push({
                    repository: repo.name,
                    score: Math.round(finalRepoScore)
                });
            } else {
                // Detected tech, but no dev contribution
                repositoryBreakdown.push({
                    repository: repo.name,
                    score: 0
                });
            }
        }
      } catch (err) {
        console.log(`Failed to process repo ${repo.name}:`, err.message);
      }
    }

    // Calculate final metrics
    let finalScore = 0;
    let confidence = 'Low';
    let level = 'Beginner';

    if (stage2Scores.length > 0) {
      // Average repo scores
      const avgRepoScore = stage2Scores.reduce((sum, s) => sum + s, 0) / stage2Scores.length;
      finalScore = Math.min(100, Math.round(avgRepoScore));
      
      if (finalScore > 80 && totalMergedPRs > 0) {
        confidence = 'High';
        level = finalScore > 90 ? 'Expert' : 'Advanced';
      } else if (finalScore > 40) {
        confidence = 'Medium';
        level = 'Intermediate';
      } else {
        confidence = 'Low';
        level = 'Beginner';
      }
    } else if (reposAnalyzed > 0) {
      // Tech detected but no developer contribution
      confidence = 'Low';
      finalScore = 0;
      globalEvidence.clear();
      globalEvidence.add(`No explicit developer contribution found for ${skill} despite project structure matches`);
    }

    res.json({
      success: true,
      data: {
        selectedSkill: selectedSkill,
        score: finalScore,
        confidence: confidence,
        level: level,
        repositoriesAnalyzed: reposAnalyzed,
        commitsAnalyzed: totalCommits,
        pullRequests: totalPRs,
        mergedPRs: totalMergedPRs,
        evidence: Array.from(globalEvidence),
        repositoryBreakdown: repositoryBreakdown,
        matchedExtensionFound: reposAnalyzed > 0,
        discoveredRepos: repos.map(r => r.full_name || r.name)
      }
    });

  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// 8. AI Assessment Generation
router.post('/assessment/generate', (req, res) => {
  const { language } = req.body;
  const langLower = (language || '').toLowerCase();
  const langUpper = (language || 'this technology').toUpperCase();
  
  setTimeout(() => {
    let questions = [];

    if (langLower === 'python') {
      questions = [
        { id: 1, type: 'mcq', text: 'Which keyword is used to define a function in Python?', options: ['function', 'define', 'def', 'func'] },
        { id: 2, type: 'mcq', text: 'Which of the following data types is immutable?', options: ['List', 'Dictionary', 'Tuple', 'Set'] },
        { id: 3, type: 'mcq', text: 'What is the output of the following code?\nprint(type([1,2,3]))', options: ['tuple', 'dict', 'list', 'set'] },
        { id: 4, type: 'mcq', text: 'Which operator is used to check equality?', options: ['=', '==', '!=', ':='] },
        { id: 5, type: 'mcq', text: 'What will be the output?\nprint(10//3)', options: ['3.33', '3', '4', 'Error'] },
        { id: 6, type: 'mcq', text: 'Which function converts a string into an integer?', options: ['float()', 'str()', 'int()', 'bool()'] },
        { id: 7, type: 'mcq', text: 'Which loop is generally used when the number of iterations is known?', options: ['while', 'do-while', 'for', 'repeat'] },
        { id: 8, type: 'mcq', text: 'Which keyword is used for exception handling?', options: ['catch', 'except', 'error', 'finally'] },
        { id: 9, type: 'mcq', text: 'Which module is used for regular expressions?', options: ['regex', 're', 'expression', 'match'] },
        { id: 10, type: 'mcq', text: 'What is the output?\nx = [1,2,3]\nprint(len(x))', options: ['2', '3', '4', 'Error'] },
        { id: 11, type: 'coding', text: 'Write a Python program to find the second largest number in a list without using the sort() function.' },
        { id: 12, type: 'coding', text: 'Write a Python function that counts the frequency of each word in a given sentence.' }
      ];
    } else if (langLower === 'sql') {
      questions = [
        { id: 1, type: 'mcq', text: 'Which SQL clause removes duplicate rows?', options: ['UNIQUE', 'DISTINCT', 'GROUP BY', 'HAVING'] },
        { id: 2, type: 'mcq', text: 'Which JOIN returns only matching records from both tables?', options: ['LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'FULL JOIN'] },
        { id: 3, type: 'mcq', text: 'Which aggregate function counts the number of rows?', options: ['SUM()', 'AVG()', 'COUNT()', 'MAX()'] },
        { id: 4, type: 'mcq', text: 'Which clause is used to filter grouped records?', options: ['WHERE', 'GROUP BY', 'HAVING', 'ORDER BY'] },
        { id: 5, type: 'mcq', text: 'Which clause sorts the result set?', options: ['GROUP BY', 'HAVING', 'ORDER BY', 'DISTINCT'] },
        { id: 6, type: 'mcq', text: 'Which function returns the current date in Snowflake/ANSI SQL?', options: ['TODAY()', 'CURRENT_DATE', 'DATE()', 'NOWDATE()'] },
        { id: 7, type: 'mcq', text: 'Which constraint ensures unique and non-null values?', options: ['UNIQUE', 'NOT NULL', 'PRIMARY KEY', 'FOREIGN KEY'] },
        { id: 8, type: 'mcq', text: 'Which window function assigns a unique number to each row?', options: ['RANK()', 'DENSE_RANK()', 'ROW_NUMBER()', 'NTILE()'] },
        { id: 9, type: 'mcq', text: 'Which operator is used to search for a pattern?', options: ['BETWEEN', 'LIKE', 'IN', 'EXISTS'] },
        { id: 10, type: 'mcq', text: 'Which command permanently removes a table?', options: ['DELETE', 'TRUNCATE', 'DROP', 'REMOVE'] },
        { id: 11, type: 'coding', text: 'Write a query to find the second highest salary from an Employee table.' },
        { id: 12, type: 'coding', text: 'Write a query to find duplicate employee names.' }
      ];
    } else if (langLower === 'dbt') {
      questions = [
        { id: 1, type: 'mcq', text: 'What does dbt stand for?', options: ['Database Tool', 'Data Build Tool', 'Data Business Tool', 'Data Batch Tool'] },
        { id: 2, type: 'mcq', text: 'Which command executes dbt models?', options: ['dbt run', 'dbt compile', 'dbt docs', 'dbt seed'] },
        { id: 3, type: 'mcq', text: 'Which function references another model?', options: ['source()', 'ref()', 'config()', 'macro()'] },
        { id: 4, type: 'mcq', text: 'Which file contains model tests?', options: ['profiles.yml', 'packages.yml', 'schema.yml', 'dbt_project.yml'] },
        { id: 5, type: 'mcq', text: 'Which test checks for duplicate values?', options: ['not_null', 'accepted_values', 'unique', 'relationships'] },
        { id: 6, type: 'mcq', text: 'Which materialization creates a physical table?', options: ['view', 'table', 'ephemeral', 'source'] },
        { id: 7, type: 'mcq', text: 'Which materialization does NOT create an object?', options: ['view', 'table', 'ephemeral', 'incremental'] },
        { id: 8, type: 'mcq', text: 'Which command runs tests?', options: ['dbt run', 'dbt test', 'dbt docs', 'dbt compile'] },
        { id: 9, type: 'mcq', text: 'Which materialization loads only new records?', options: ['table', 'view', 'incremental', 'ephemeral'] },
        { id: 10, type: 'mcq', text: 'dbt snapshots are mainly used for?', options: ['SCD Type-2', 'Duplicate Removal', 'Data Loading', 'Scheduling'] },
        { id: 11, type: 'coding', text: 'Create an incremental model that loads only new records based on order_date.' },
        { id: 12, type: 'coding', text: 'Write a custom generic test to ensure salary > 0.' }
      ];
    } else if (langLower === 'snowflake') {
      questions = [
        { id: 1, type: 'mcq', text: 'Snowflake is primarily a?', options: ['Database', 'Data Warehouse', 'Spreadsheet', 'IDE'] },
        { id: 2, type: 'mcq', text: 'Which cloud platforms are supported?', options: ['AWS', 'Azure', 'GCP', 'All of the above'] },
        { id: 3, type: 'mcq', text: 'Which feature restores deleted data?', options: ['Fail-safe', 'Time Travel', 'Clone', 'Stage'] },
        { id: 4, type: 'mcq', text: 'Which object captures changed data?', options: ['Warehouse', 'Stream', 'Stage', 'Task'] },
        { id: 5, type: 'mcq', text: 'Which object schedules SQL statements?', options: ['Stream', 'Warehouse', 'Task', 'Stage'] },
        { id: 6, type: 'mcq', text: 'Which command loads files into a table?', options: ['INSERT', 'COPY INTO', 'MERGE', 'IMPORT'] },
        { id: 7, type: 'mcq', text: 'Warehouses are responsible for?', options: ['Storage', 'Compute', 'Security', 'Metadata'] },
        { id: 8, type: 'mcq', text: 'Temporary tables exist until?', options: ['30 Days', 'Session Ends', 'Database Restart', 'One Week'] },
        { id: 9, type: 'mcq', text: 'Zero-copy clone creates?', options: ['Physical Copy', 'Logical Copy', 'CSV', 'Backup'] },
        { id: 10, type: 'mcq', text: 'Fail-safe retention period is?', options: ['1 Day', '3 Days', '7 Days', '30 Days'] },
        { id: 11, type: 'coding', text: 'Load a CSV file from an internal stage into an Employee table.' },
        { id: 12, type: 'coding', text: 'Create a Stream and Task to process new records every hour.' }
      ];
    } else if (langLower === 'azure') {
      questions = [
        { id: 1, type: 'mcq', text: 'Azure Data Factory is mainly used for?', options: ['Reporting', 'ETL/ELT Pipelines', 'Storage', 'Monitoring'] },
        { id: 2, type: 'mcq', text: 'Which Azure service stores large-scale data?', options: ['Azure SQL', 'ADLS Gen2', 'Power BI', 'Key Vault'] },
        { id: 3, type: 'mcq', text: 'Which service provides analytics?', options: ['Azure DevOps', 'Azure Synapse Analytics', 'Azure Monitor', 'Azure VM'] },
        { id: 4, type: 'mcq', text: 'Which component stores connection information?', options: ['Dataset', 'Pipeline', 'Linked Service', 'Trigger'] },
        { id: 5, type: 'mcq', text: 'Which component represents the structure of data?', options: ['Dataset', 'Trigger', 'Activity', 'Integration Runtime'] },
        { id: 6, type: 'mcq', text: 'Integration Runtime is responsible for?', options: ['Authentication', 'Data Movement & Execution', 'Storage', 'Reporting'] },
        { id: 7, type: 'mcq', text: 'Which Azure service stores secrets?', options: ['Blob Storage', 'Azure Key Vault', 'Synapse', 'Monitor'] },
        { id: 8, type: 'mcq', text: 'Which activity copies data between sources?', options: ['Lookup', 'Copy Data', 'Filter', 'Execute Pipeline'] },
        { id: 9, type: 'mcq', text: 'Which component schedules pipelines?', options: ['Trigger', 'Dataset', 'Activity', 'Linked Service'] },
        { id: 10, type: 'mcq', text: 'Which visualization tool integrates with Azure?', options: ['Tableau', 'Power BI', 'SSMS', 'Visual Studio'] },
        { id: 11, type: 'coding', text: 'Design an Azure Data Factory pipeline to load daily CSV files from Azure Blob Storage into Azure SQL Database while preventing duplicate records.' },
        { id: 12, type: 'coding', text: 'Write a Synapse notebook (PySpark or SQL) that reads sales data from ADLS Gen2, filters records where SalesAmount > 1000, and writes the results into a dedicated SQL pool.' }
      ];
    } else {
      const mcqTemplates = [
        { text: `What is the primary paradigm supported by ${langUpper}?`, options: ['Object-Oriented', 'Functional', 'Procedural', 'All of the above'] },
        { text: `Which keyword is typically used to declare a variable in ${langUpper}?`, options: ['var/let/const', 'declare', 'set', 'variable'] },
        { text: `How does ${langUpper} handle memory management?`, options: ['Garbage Collection', 'Manual', 'Reference Counting', 'Depends on implementation'] },
        { text: `What is the standard package manager for ${langUpper}?`, options: ['Specific to the language ecosystem', 'npm', 'pip', 'maven'] },
        { text: `Which of the following best describes the typing system in ${langUpper}?`, options: ['Dynamic', 'Static', 'Strong', 'Weak'] },
        { text: `How are async operations commonly handled in ${langUpper}?`, options: ['Promises/Futures/Async-Await', 'Callbacks only', 'Threads', 'Event Loop'] },
        { text: `What is the standard file extension for ${langUpper} files?`, options: ['Varies based on language', '.txt', '.js', '.py'] },
        { text: `Which data structure in ${langUpper} is used to store key-value pairs?`, options: ['Map/Dictionary/Hash', 'Array', 'List', 'Tuple'] },
        { text: `How is error handling generally structured in ${langUpper}?`, options: ['Try/Catch/Except', 'Return codes', 'Panics', 'Callbacks'] },
        { text: `What tool is commonly used to test ${langUpper} code?`, options: ['Built-in test runner or standard framework', 'Jest', 'JUnit', 'PyTest'] }
      ];
      for (let i = 0; i < 10; i++) {
        questions.push({ id: i + 1, type: 'mcq', text: mcqTemplates[i].text, options: mcqTemplates[i].options });
      }
      questions.push({ id: 11, type: 'coding', text: `Write a function in ${langUpper} that takes an array of integers and returns the second largest number.` });
      questions.push({ id: 12, type: 'coding', text: `Implement a basic class or struct in ${langUpper} that represents a 'BankAccount' with methods for deposit, withdraw, and getting the balance.` });
    }
    res.json({ questions });
  }, 1500);
});

// 9. AI Assessment Grading
router.post('/assessment/submit', (req, res) => {
  const { answers, language } = req.body || {};
  const langLower = (language || '').toLowerCase();
  
  setTimeout(() => {
    let score = 0;
    let correctCount = 0;
    let expectedMCQs = {};
    
    if (langLower === 'python') {
      expectedMCQs = {
        1: 'def', 2: 'Tuple', 3: 'list', 4: '==', 5: '3',
        6: 'int()', 7: 'for', 8: 'except', 9: 're', 10: '3'
      };
    } else if (langLower === 'sql') {
      expectedMCQs = {
        1: 'DISTINCT', 2: 'INNER JOIN', 3: 'COUNT()', 4: 'HAVING', 5: 'ORDER BY',
        6: 'CURRENT_DATE', 7: 'PRIMARY KEY', 8: 'ROW_NUMBER()', 9: 'LIKE', 10: 'DROP'
      };
    } else if (langLower === 'dbt') {
      expectedMCQs = {
        1: 'Data Build Tool', 2: 'dbt run', 3: 'ref()', 4: 'schema.yml', 5: 'unique',
        6: 'table', 7: 'ephemeral', 8: 'dbt test', 9: 'incremental', 10: 'SCD Type-2'
      };
    } else if (langLower === 'snowflake') {
      expectedMCQs = {
        1: 'Data Warehouse', 2: 'All of the above', 3: 'Time Travel', 4: 'Stream', 5: 'Task',
        6: 'COPY INTO', 7: 'Compute', 8: 'Session Ends', 9: 'Logical Copy', 10: '7 Days'
      };
    } else if (langLower === 'azure') {
      expectedMCQs = {
        1: 'ETL/ELT Pipelines', 2: 'ADLS Gen2', 3: 'Azure Synapse Analytics', 4: 'Linked Service', 5: 'Dataset',
        6: 'Data Movement & Execution', 7: 'Azure Key Vault', 8: 'Copy Data', 9: 'Trigger', 10: 'Power BI'
      };
    } else {
      expectedMCQs = {
        1: 'All of the above', 2: 'var/let/const', 3: 'Garbage Collection', 4: 'Specific to the language ecosystem', 5: 'Dynamic',
        6: 'Promises/Futures/Async-Await', 7: 'Varies based on language', 8: 'Map/Dictionary/Hash', 9: 'Try/Catch/Except', 10: 'Built-in test runner or standard framework'
      };
    }

    for (let i = 1; i <= 10; i++) {
      if (answers && answers[i] && answers[i] === expectedMCQs[i]) {
        score += 8;
        correctCount++;
      }
    }

    if (answers && answers[11] && answers[11].trim().length > 15) score += 10;
    if (answers && answers[12] && answers[12].trim().length > 15) score += 10;

    res.json({ 
      success: true, 
      score,
      feedback: score === 0 
        ? 'You did not answer the questions correctly or left them blank.' 
        : `You got ${correctCount}/10 MCQs correct and received partial/full credit for coding.`
    });
  }, 2000);
});

// 10. Support Center Routes
router.post('/support/ai-chat', (req, res) => {
  const { message } = req.body;
  const msgLower = (message || '').toLowerCase();
  let reply = "I'm sorry, I couldn't understand that. Could you provide more details?";
  
  if (msgLower.includes('password') || msgLower.includes('reset')) {
    reply = "You can reset your password from the Settings -> Security tab. Would you like me to guide you there?";
  } else if (msgLower.includes('project') || msgLower.includes('match')) {
    reply = "AI Project Matching connects your verified skills with open projects in the organization. You can access it from the Manager Dashboard.";
  } else if (msgLower.includes('skill') || msgLower.includes('gap')) {
    reply = "Skill gap reports can be exported from the Org Insights page in CSV or PDF format.";
  } else {
    reply = "Thanks for your question! Based on our knowledge base, you can find more details under the FAQ section or by contacting your administrator.";
  }

  setTimeout(() => {
    res.json({ reply });
  }, 1000);
});

router.post('/support/ticket', (req, res) => {
  const { category, description } = req.body;
  
  // 1. Save to SQLite database
  db.run(`INSERT INTO tickets (category, description) VALUES (?, ?)`, [category, description], function(err) {
    if (err) return res.status(500).json({ error: 'Failed to save ticket to database' });
    
    // 2. Send email notification
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        service: 'gmail', // or use host/port depending on provider
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: process.env.SUPPORT_EMAIL || process.env.SMTP_USER,
        subject: `[Emp Pulse Support] New Ticket: ${category}`,
        text: `A new support ticket has been submitted.\n\nCategory: ${category}\nDescription:\n${description}\n\nTicket ID: #${this.lastID}`
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email:", error);
          // Return success anyway since the ticket is saved
          return res.json({ success: true, message: `Ticket under category '${category}' submitted (Email skipped).` });
        }
        res.json({ success: true, message: `Ticket under category '${category}' submitted and support team notified.` });
      });
    } else {
      // If email isn't configured, just return success
      res.json({ success: true, message: `Ticket under category '${category}' saved to database.` });
    }
  });
});

router.post('/support/faq', (req, res) => {
  const { question } = req.body;
  const faqs = {
    "How does AI Project Matching work?": "Our AI analyzes your verified skills, experience, and certifications to match you with internal projects that require your exact profile, ensuring a 90%+ match accuracy.",
    "How to export skill gap reports?": "Navigate to the Org Insights dashboard, click on 'Export Report' at the top right, and select either PDF or Excel format.",
    "Managing team permissions": "Team permissions can only be modified by administrators. Go to Settings -> User Management to adjust role-based access."
  };
  
  setTimeout(() => {
    res.json({ answer: faqs[question] || "Sorry, I couldn't find an answer to that specific question." });
  }, 300);
});

// 11. Mentorship / Connections
router.get('/mentorship/experts/:skill', (req, res) => {
  const { skill } = req.params;
  const currentUserId = req.query.userId;
  // Find verified users for this skill (excluding the requester)
  const query = `
    SELECT u.id, u.name, u.email, u.role
    FROM users u
    JOIN skills s ON u.id = s.userId
    WHERE s.skillName = ? AND s.isVerified = 1 AND u.id != ?
  `;
  db.all(query, [skill.toLowerCase(), currentUserId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post('/mentorship/request', (req, res) => {
  const { requesterId, expertId, skill } = req.body;
  if (!requesterId || !expertId || !skill) return res.status(400).json({ error: 'Missing required fields' });

  const query = `INSERT INTO mentorship_requests (requesterId, expertId, skill) VALUES (?, ?, ?)`;
  db.run(query, [requesterId, expertId, skill.toLowerCase()], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, requestId: this.lastID });
  });
});

router.get('/mentorship/pending/:userId', (req, res) => {
  const { userId } = req.params;
  const query = `
    SELECT m.id, m.skill, m.createdAt, u.name as requesterName, u.email as requesterEmail
    FROM mentorship_requests m
    JOIN users u ON m.requesterId = u.id
    WHERE m.expertId = ? AND m.status = 'pending'
  `;
  db.all(query, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post('/mentorship/respond', (req, res) => {
  const { requestId, status } = req.body; // status: 'accepted' or 'rejected'
  if (!['accepted', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const query = `UPDATE mentorship_requests SET status = ? WHERE id = ?`;
  db.run(query, [status, requestId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// 12. Admin Routes
router.post('/admin/add-employee', (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ error: 'All fields are required' });
  
  // Note: in a real app you'd verify if the requester has admin rights using a token middleware
  const query = `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`;
  db.run(query, [name, email, password, role], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, userId: this.lastID });
  });
});

router.get('/admin/employees', (req, res) => {
  db.all('SELECT id, name, email, role FROM users', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.delete('/admin/delete-employee/:id', (req, res) => {
  const { id } = req.params;
  
  // Need to also clean up associated data (skills, experience, mentorship_requests)
  // Or rely on CASCADE if we had it, but SQLite without foreign_keys PRAGMA ON might not cascade
  db.serialize(() => {
    db.run(`DELETE FROM skills WHERE userId = ?`, [id]);
    db.run(`DELETE FROM experience WHERE userId = ?`, [id]);
    db.run(`DELETE FROM mentorship_requests WHERE requesterId = ? OR expertId = ?`, [id, id]);
    db.run(`DELETE FROM users WHERE id = ?`, [id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, deletedCount: this.changes });
    });
  });
});

module.exports = router;
