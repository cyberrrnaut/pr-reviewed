import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from 'cors';
import OpenAI from 'openai';


dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const redirect_uri = "https://workik-be.cyb3rnaut.com/callback"

const app = express();
const PORT = 5000;

app.use(cors());

app.use(express.json());

interface ChangedFile {
    filename: string; // Adjust this based on the actual structure of the changed file objects
  }
  

app.get("/up",(req,res)=>{
  res.json({"msg":"the site is up"})
})


// Step 1: Redirect to GitHub OAuth
app.get('/auth/github', (req, res) => {
  const redirectURI = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=repo&redirect_uri=${redirect_uri}`;
  res.redirect(redirectURI);
});

console.log(process.env.GITHUB_CLIENT_ID);


// Step 2: Handle OAuth Callback and Get Access Token
app.get('/callback', async (req, res) => {
    const requestToken = req.query.code;
  
    try {
      // Exchange the authorization code for an access token
      const response = await axios.post(`https://github.com/login/oauth/access_token`, {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: requestToken,
      }, {
        headers: { accept: 'application/json' }
      });
  
      const accessToken = response.data.access_token;
  
      // Redirect to frontend with the token as a query parameter
      res.redirect(`https://autogit.cyb3rnaut.com//?token=${accessToken}`);
    } catch (err) {
      console.error('Error getting access token:', err);
      res.status(500).json({ error: 'OAuth failed' });
    }
  });

// Step 3: Create Webhook for Pull Request Events

app.post('/create-webhook', async (req, res:any) => {
    const { token, repo } = req.body;
  
    const [owner, repoName] = repo.split('/');
  
    if (!token || !repo || !owner || !repoName) {
      return res.status(400).send('Invalid request: Missing parameters');
    }
  
    try {
      const response = await axios.post(
        `https://api.github.com/repos/${owner}/${repoName}/hooks`,
        {
          name: 'web',
          active: true,
          events: ['push', 'pull_request'],
          config: {
            url: 'https://workik-be/webhook',
            content_type: 'json',
            insecure_ssl: '0',
          },
        },
        {
          headers: {
            Authorization: `token ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github+json',
          },
        }
      ); 
      console.log(token);
      
       console.log('Webhook created successfully!');
       
      res.status(201).send('Webhook created successfully!');
    } catch (error:any) {
      console.error('Error creating webhook:', error.response ? error.response.data : error.message);
  
      if (error.response) {
        if (error.response.status === 403) {
          return res.status(403).send('Forbidden: Check token permissions.');
        } else if (error.response.status === 404) {
          return res.status(404).send('Not Found: Check the repository and owner.');
        } else if (error.response.status === 422) {
          return res.status(422).send('Validation failed: Check webhook configuration.');
        }
      }
  
      res.status(500).send('Error creating webhook');
    }
  });
  

// open ai


//////////////////////
async function reviewPullRequestWithAI(pullRequest: any, changedFiles: ChangedFile[]) {
  const { title, body } = pullRequest;

  // Create a prompt to send to the AI model
  const prompt = `
      Review this pull request:
      Title: ${title}
      Description: ${body}
      Changed Files: ${changedFiles.map((file: ChangedFile) => file.filename).join(', ')}
  `;

  // Call the OpenAI model to get a review of the PR
  try {
      const response = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo', // You can switch to 'gpt-4' if you have access
          messages: [
              { role: 'system', content: 'You are a professional code reviewer.' },
              { role: 'user', content: prompt },
          ],
      });

      // Check if response is valid
      if (response.choices && response.choices.length > 0) {
          const aiReview = response.choices[0].message.content;
          return aiReview; // Return the AI-generated review
      } else {
          throw new Error('No choices returned from OpenAI response');
      }
  } catch (error: any) {
      // Improved error handling with specific messages
      if (error.response) {
          // The request was made, and the server responded with a status code
          console.error('Error getting AI review:', {
              message: error.message,
              status: error.response.status,
              data: error.response.data,
          });
          throw new Error(`OpenAI API responded with an error: ${error.response.data.error.message}`);
      } else {
          // Something happened in setting up the request
          console.error('Unexpected error while contacting OpenAI:', error.message);
          throw new Error('An unexpected error occurred while contacting the OpenAI API.');
      }
  }
}


// Webhook to receive GitHub events
app.post('/webhook', async (req:any, res:any) => {
  const event = req.headers['x-github-event'];
  console.log('Webhook event received:', event);

  if (event === 'pull_request' && req.body.action === 'opened') {
      const pullRequest = req.body.pull_request;
      const prTitle = pullRequest.title;
      const prBody = pullRequest.body;
      const prUrl = pullRequest.html_url;
      const pullNumber = pullRequest.number; // Get the pull request number
      const owner = req.body.repository.owner.login; // Get the owner of the repository
      const repoName = req.body.repository.name; // Get the repository name

      console.log(`PR created: ${prTitle}, URL: ${prUrl}`);

      // Fetch changed files from GitHub
      const changedFiles = await fetchChangedFiles(owner, repoName, pullNumber);

      // Log the changed files response to understand its structure
      console.log('Changed Files Response:', changedFiles);

      // Check if changedFiles is an array and log the filenames
      if (Array.isArray(changedFiles)) {
          console.log(`Changed Files: ${changedFiles.map(file => file.filename).join(', ')}`);
      } else {
          console.error('Failed to retrieve changed files:', changedFiles);
          return res.status(500).send('Failed to retrieve changed files'); // Handle the error appropriately
      }

      // Call your AI review function here
      const reviewComment = await reviewPullRequestWithAI(pullRequest, changedFiles);

      // Post the review as a comment on GitHub
      await postReviewCommentOnPR(pullRequest, reviewComment);

      console.log('Review comment posted');
  }

  res.status(200).send('Webhook processed successfully');
});

// Fetch changed files from the GitHub API
const fetchChangedFiles = async (owner: any, repoName: any, pullNumber: any) => {
  const token = process.env.GITHUB_ACCESS_TOKEN; // Access the GitHub token from environment variables

  try {
      const response = await axios.get(`https://api.github.com/repos/${owner}/${repoName}/pulls/${pullNumber}/files`, {
          headers: {
              'Authorization': `token ${token}`, // Use the token from environment
              'Accept': 'application/vnd.github.v3+json', // Specify the GitHub API version
          }
      });

      return response.data; // This should return an array of changed files
  } catch (error: any) {
      console.error('Error fetching changed files:', error.response ? error.response.data : error.message);
      return []; // Return an empty array instead of null for safer handling
  }
};

// Function to post the review comment back to the PR (implement this)
async function postReviewCommentOnPR(pullRequest: any, reviewComment: any) {
  const repoOwner = pullRequest.base.repo.owner.login;
  const repoName = pullRequest.base.repo.name;
  const prNumber = pullRequest.number;
  const token = process.env.GITHUB_ACCESS_TOKEN; // Your GitHub token

  try {
      const response = await axios.post(
          `https://api.github.com/repos/${repoOwner}/${repoName}/issues/${prNumber}/comments`,
          { body: reviewComment },
          {
              headers: {
                  Authorization: `token ${token}`,
                  'Content-Type': 'application/json',
              },
          }
      );
      console.log('Review comment posted on PR:', prNumber);
  } catch (error) {
      console.error('Error posting comment on PR:', error);
  }
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
