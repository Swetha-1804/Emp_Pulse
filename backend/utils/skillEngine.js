const axios = require('axios');

// STAGE 1: Technology Detection Engine
const detectTechnology = (skill, repoName, files, folders) => {
    let evidenceLevel = 'NONE';
    let evidence = [];
    const lowerSkill = skill.toLowerCase();
    const repoNameLower = repoName.toLowerCase();

    // Fast-path: Repo name check
    if (repoNameLower.includes(lowerSkill) || repoNameLower.includes(lowerSkill.replace(' ', '-'))) {
        evidence.push(`Repository name implies ${skill}`);
        evidenceLevel = 'STRONG';
    }

    if (lowerSkill === 'dbt') {
        const hasDbtProject = files.some(f => f.includes('dbt_project.yml'));
        const hasModels = folders.some(f => f.includes('models/'));
        const hasMacros = folders.some(f => f.includes('macros/'));
        const hasPackages = files.some(f => f.includes('packages.yml'));

        if (hasDbtProject) {
            evidenceLevel = 'STRONG';
            evidence.push('dbt_project.yml detected');
        } else if (hasModels && files.some(f => f.endsWith('.sql'))) {
            evidenceLevel = 'MODERATE';
        } else if (files.some(f => f.endsWith('.sql'))) {
            if (evidenceLevel === 'NONE') evidenceLevel = 'WEAK';
        }

        if (hasModels) evidence.push('models/ folder found');
        if (hasMacros) evidence.push('macros/ folder found');
        if (hasPackages) evidence.push('packages.yml detected');
        if (files.some(f => f.includes('profiles.yml'))) evidence.push('profiles.yml found');

    } else if (lowerSkill === 'sql' || lowerSkill === 'snowflake') {
        const hasDbtProject = files.some(f => f.includes('dbt_project.yml'));
        if (files.some(f => f.endsWith('.sql'))) {
            if (hasDbtProject && lowerSkill !== 'snowflake') {
                // It's a dbt project, weak evidence for plain SQL unless proven otherwise
                if (evidenceLevel === 'NONE') evidenceLevel = 'WEAK';
                evidence.push('SQL files found (within dbt project)');
            } else {
                evidenceLevel = 'STRONG';
                evidence.push('SQL files detected');
            }
        }
        if (lowerSkill === 'snowflake' && files.some(f => f.includes('snowflake'))) {
            evidenceLevel = 'STRONG';
            evidence.push('Snowflake configs detected');
        }
    } else if (lowerSkill === 'python') {
        const hasReqs = files.some(f => f.includes('requirements.txt'));
        const hasToml = files.some(f => f.includes('pyproject.toml'));
        const hasPy = files.some(f => f.endsWith('.py') || f.endsWith('.ipynb'));

        if (hasReqs || hasToml) {
            evidenceLevel = 'STRONG';
            if (hasReqs) evidence.push('requirements.txt found');
            if (hasToml) evidence.push('pyproject.toml found');
        } else if (hasPy) {
            evidenceLevel = evidenceLevel === 'NONE' ? 'MODERATE' : evidenceLevel;
            evidence.push('Python source files found');
        }
    } else if (lowerSkill === 'azure') {
        const hasAzureFiles = files.some(f => f.includes('azure-pipelines.yml') || f.endsWith('.bicep') || (f.includes('arm') && f.endsWith('.json')));
        const hasAzureFolders = folders.some(f => f.includes('pipelines/') || f.includes('adf/') || f.includes('azure/'));

        if (hasAzureFiles) {
            evidenceLevel = 'STRONG';
            evidence.push('Azure project files/pipelines found');
        } else if (hasAzureFolders) {
            evidenceLevel = 'MODERATE';
            evidence.push('Azure folder structures found');
        } else if (files.some(f => f.endsWith('.yml'))) {
            if (evidenceLevel === 'NONE') evidenceLevel = 'WEAK';
        }
    } else {
        // Fallback
        if (files.some(f => f.endsWith('.js') || f.endsWith('.jsx') || f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.java'))) {
            evidenceLevel = 'MODERATE';
            evidence.push('Code files found');
        }
    }

    return { evidenceLevel, evidence };
};

// STAGE 2: Developer Contribution Verification
const verifyDeveloperContribution = async (skill, username, owner, repoName, headers) => {
    let devEvidence = [];
    let commitsScore = 0;
    let codePatternScore = 0;
    const lowerSkill = skill.toLowerCase();
    let filesModified = 0;

    try {
        // 1. Fetch commits authored explicitly by this user
        const commitsRes = await axios.get(`https://api.github.com/repos/${owner}/${repoName}/commits?author=${username}&per_page=10`, { headers });
        const commits = commitsRes.data;

        if (commits.length > 0) {
            devEvidence.push(`${commits.length} developer commits`);
            commitsScore = Math.min(100, commits.length * 10);
        }

        // 2. Code Pattern Analysis (Deep scan of user's commits)
        let foundPatterns = new Set();
        for (const commit of commits.slice(0, 5)) {
            try {
                const commitDetail = await axios.get(commit.url, { headers });
                const files = commitDetail.data.files || [];
                
                for (const f of files) {
                    const patch = (f.patch || '').toLowerCase();
                    if (!patch) continue;

                    if (lowerSkill === 'dbt' && (f.filename.endsWith('.sql') || f.filename.endsWith('.yml'))) {
                        filesModified++;
                        if (patch.includes('{{ ref(') || patch.includes('{{ref(')) foundPatterns.add('ref() detected');
                        if (patch.includes('{{ source(') || patch.includes('{{source(')) foundPatterns.add('source() detected');
                        if (patch.includes('config(')) foundPatterns.add('config() macro detected');
                        if (patch.includes('materialized')) foundPatterns.add('materialization detected');
                    }
                    if ((lowerSkill === 'sql' || lowerSkill === 'snowflake') && f.filename.endsWith('.sql')) {
                        filesModified++;
                        if (!patch.includes('{{')) foundPatterns.add('Pure SQL patterns detected');
                    }
                    if (lowerSkill === 'python' && f.filename.endsWith('.py')) {
                        filesModified++;
                        if (patch.includes('import ') || patch.includes('from ')) foundPatterns.add('Python imports detected');
                    }
                    if (lowerSkill === 'azure' && (f.filename.endsWith('.json') || f.filename.endsWith('.yml'))) {
                        filesModified++;
                        if (patch.includes('schema.management.azure.com')) foundPatterns.add('Azure ARM schemas detected');
                    }
                }
            } catch (err) {
                // Skip commit detail errors
            }
        }

        if (filesModified > 0) {
            devEvidence.push(`${filesModified} ${skill}-related files identified`);
        }

        if (foundPatterns.size > 0) {
            codePatternScore = Math.min(100, foundPatterns.size * 25);
            foundPatterns.forEach(p => devEvidence.push(p));
        }

        // 3. PR Analysis
        let prScore = 0;
        let prCount = 0;
        let mergedCount = 0;
        try {
            const prsRes = await axios.get(`https://api.github.com/repos/${owner}/${repoName}/pulls?state=all&per_page=10`, { headers });
            // Filter PRs created by the user
            const userPrs = prsRes.data.filter(pr => pr.user && pr.user.login.toLowerCase() === username.toLowerCase());
            const mergedPrs = userPrs.filter(pr => pr.merged_at);
            
            prCount = userPrs.length;
            mergedCount = mergedPrs.length;

            if (prCount > 0) {
                devEvidence.push(`${prCount} ${skill}-related pull requests`);
                prScore += prCount * 10;
            }
            if (mergedCount > 0) {
                devEvidence.push(`${mergedCount} merged pull requests`);
                prScore += mergedCount * 15;
            }
            prScore = Math.min(100, prScore);
        } catch (err) {
            // Skip PR error
        }

        return { 
            hasContribution: commits.length > 0, 
            devEvidence, 
            commitsScore, 
            codePatternScore,
            prScore,
            totalCommits: commits.length,
            prCount,
            mergedCount
        };

    } catch (err) {
        return { hasContribution: false, devEvidence: [], commitsScore: 0, codePatternScore: 0, prScore: 0, totalCommits: 0, prCount: 0, mergedCount: 0 };
    }
};

module.exports = { detectTechnology, verifyDeveloperContribution };
