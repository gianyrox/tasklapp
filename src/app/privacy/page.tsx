'use client';

import React from 'react';
import AppLayout from '../../components/layout/AppLayout';
import styles from './Privacy.module.css';

const PrivacyPage: React.FC = () => {
  return (
    <AppLayout>
      <div className={styles.privacyContainer}>
        <div className={styles.header}>
          <h1>Privacy Policy</h1>
          <p className={styles.lastUpdated}>
            <strong>Effective Date:</strong> June 9, 2025<br />
            <strong>Last Updated:</strong> June 9, 2025
          </p>
        </div>

        <div className={styles.content}>
          <section>
            <h2>1. Introduction</h2>
            <p>
              TasklApp ("we," "our," or "us") respects your privacy and is committed to protecting your personal information. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our 
              web application at TasklApp.app and our Chrome browser extension (collectively, the "Service").
            </p>
            <p>
              By using our Service, you agree to the collection and use of information in accordance with this Privacy Policy.
            </p>
          </section>

          <section>
            <h2>2. Information We Collect</h2>
            
            <h3>2.1 Personal Information You Provide</h3>
            <p>When you create an account or use our Service, we collect:</p>
            <ul>
              <li><strong>Email Address:</strong> Used for account creation, authentication, and notifications</li>
              <li><strong>Name:</strong> Your display name used throughout the application</li>
              <li><strong>Profile Avatar:</strong> Optional profile picture (stored via URL)</li>
              <li><strong>Task Information:</strong> Tasks you create, assign, or receive including titles, descriptions, due dates, and completion status</li>
              <li><strong>Account Preferences:</strong> Settings and preferences for your user experience</li>
            </ul>

            <h3>2.2 Information Collected Through Chrome Extension</h3>
            <p>Our Chrome extension collects the following with your permission:</p>
            <ul>
              <li><strong>Tab Information:</strong> Current page URL and title when you choose to include them in task descriptions</li>
              <li><strong>Browser Storage:</strong> Authentication tokens and user preferences stored locally in your browser</li>
              <li><strong>Extension Usage Data:</strong> Information about how you interact with the extension popup</li>
            </ul>

            <div className={styles.highlight}>
              <h4>Chrome Extension Permissions:</h4>
              <ul>
                <li><code>tabs</code>: Access to current tab information for task creation convenience</li>
                <li><code>storage</code>: Local storage for authentication state and user preferences</li>
                <li><code>&lt;all_urls&gt;</code>: Host permissions to function across all websites (no data is collected from visited websites)</li>
              </ul>
            </div>

            <h3>2.3 Automatically Collected Information</h3>
            <p>We automatically collect certain information when you use our Service:</p>
            <ul>
              <li><strong>Usage Analytics:</strong> Page views, feature usage, and user interactions (via Vercel Analytics)</li>
              <li><strong>Authentication Logs:</strong> Login attempts, session management, and security events</li>
              <li><strong>Performance Data:</strong> Application performance metrics and error tracking</li>
              <li><strong>Device Information:</strong> Browser type, device type, and operating system</li>
              <li><strong>Session Storage:</strong> Temporary data to improve user experience and reduce server requests</li>
            </ul>

            <h3>2.4 Cookies and Tracking Technologies</h3>
            <p>We use cookies and similar technologies to:</p>
            <ul>
              <li>Maintain your authentication session</li>
              <li>Store user preferences</li>
              <li>Analyze usage patterns</li>
              <li>Improve service performance</li>
            </ul>

            <div className={styles.highlight}>
              <h4>Types of cookies we use:</h4>
              <ul>
                <li><strong>Essential Cookies:</strong> Required for authentication and core functionality</li>
                <li><strong>Analytics Cookies:</strong> Used by Vercel Analytics to understand usage patterns</li>
                <li><strong>Functional Cookies:</strong> Store your preferences and settings</li>
              </ul>
            </div>
          </section>

          <section>
            <h2>3. How We Use Your Information</h2>
            <p>We use the collected information for:</p>

            <h3>3.1 Core Service Functions</h3>
            <ul>
              <li>Creating and managing your user account</li>
              <li>Enabling task creation, assignment, and tracking</li>
              <li>Facilitating communication between users</li>
              <li>Managing friend connections and invitations</li>
              <li>Calculating leaderboard rankings and statistics</li>
            </ul>

            <h3>3.2 Communication</h3>
            <ul>
              <li>Sending email notifications for task assignments</li>
              <li>Account-related communications</li>
              <li>Service updates and important notices</li>
            </ul>

            <h3>3.3 Service Improvement</h3>
            <ul>
              <li>Analyzing usage patterns to improve features</li>
              <li>Identifying and fixing technical issues</li>
              <li>Developing new functionality</li>
              <li>Ensuring service security and integrity</li>
            </ul>

            <h3>3.4 Legal and Security</h3>
            <ul>
              <li>Complying with legal obligations</li>
              <li>Protecting against fraud and abuse</li>
              <li>Enforcing our Terms of Service</li>
              <li>Maintaining service security</li>
            </ul>
          </section>

          <section>
            <h2>4. Information Sharing and Disclosure</h2>

            <h3>4.1 With Other Users</h3>
            <ul>
              <li>Your name and profile information are visible to your connected friends</li>
              <li>Tasks you assign or receive are visible to relevant parties</li>
              <li>Leaderboard information may be visible to other users</li>
            </ul>

            <h3>4.2 With Service Providers</h3>
            <p>We share information with trusted third-party service providers:</p>
            <ul>
              <li><strong>Supabase:</strong> Database hosting and user authentication</li>
              <li><strong>Vercel:</strong> Application hosting and analytics</li>
              <li><strong>Resend:</strong> Email delivery services</li>
              <li><strong>Stripe:</strong> Payment processing (for premium features)</li>
            </ul>

            <h3>4.3 Legal Requirements</h3>
            <p>We may disclose your information if required by law or to:</p>
            <ul>
              <li>Comply with legal process</li>
              <li>Protect our rights and property</li>
              <li>Ensure user safety</li>
              <li>Investigate potential violations</li>
            </ul>
          </section>

          <section>
            <h2>5. Chrome Extension Privacy</h2>

            <h3>5.1 Data Collection</h3>
            <p>Our Chrome extension:</p>
            <ul>
              <li>Only accesses tab information when you actively use the extension</li>
              <li>Stores authentication data locally in your browser</li>
              <li>Does not monitor your browsing activity</li>
              <li>Does not collect data from websites you visit</li>
            </ul>

            <h3>5.2 Data Retention</h3>
            <p>Extension data is stored locally and can be cleared by:</p>
            <ul>
              <li>Uninstalling the extension</li>
              <li>Clearing browser data</li>
              <li>Using Chrome's extension data management tools</li>
            </ul>
          </section>

          <section>
            <h2>6. Your Rights and Choices</h2>

            <h3>6.1 Data Rights (GDPR/CCPA)</h3>
            <p>If applicable, you have the right to:</p>
            <ul>
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Delete your data (right to be forgotten)</li>
              <li>Port your data to another service</li>
              <li>Object to certain data processing</li>
              <li>Restrict data processing</li>
            </ul>
            <p>To exercise these rights, contact us at <a href="mailto:privacy@TasklApp.app">privacy@TasklApp.app</a>.</p>
          </section>

          <section>
            <h2>7. Data Retention</h2>
            <p>We retain your information for as long as necessary to:</p>
            <ul>
              <li>Provide our services</li>
              <li>Comply with legal obligations</li>
              <li>Resolve disputes</li>
              <li>Enforce agreements</li>
            </ul>

            <div className={styles.highlight}>
              <h4>Specific retention periods:</h4>
              <ul>
                <li><strong>Account data:</strong> Until account deletion</li>
                <li><strong>Task history:</strong> 7 years after completion</li>
                <li><strong>Analytics data:</strong> 2 years</li>
                <li><strong>Log files:</strong> 1 year</li>
              </ul>
            </div>
          </section>

          <section>
            <h2>8. Children's Privacy</h2>
            <p>
              Our Service is not intended for children under 13. We do not knowingly collect personal information 
              from children under 13. If we discover such collection, we will delete the information immediately.
            </p>
          </section>

          <section>
            <h2>9. Changes to This Policy</h2>
            <p>We may update this Privacy Policy periodically. We will notify you of significant changes via:</p>
            <ul>
              <li>Email notification</li>
              <li>In-app notifications</li>
              <li>Website announcements</li>
            </ul>
            <p>Continued use of the Service after changes constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2>10. Contact Information</h2>
            <p>For privacy-related questions or concerns:</p>
            <div className={styles.contactInfo}>
              <p><strong>Email:</strong> <a href="mailto:privacy@TasklApp.app">privacy@TasklApp.app</a></p>
              <p><strong>Support:</strong> <a href="mailto:support@TasklApp.app">support@TasklApp.app</a></p>
            </div>

            <p>For data subject requests under GDPR or CCPA, please use the subject line "Privacy Rights Request" and include:</p>
            <ul>
              <li>Your full name</li>
              <li>Email address associated with your account</li>
              <li>Specific request type</li>
              <li>Any relevant details</li>
            </ul>
          </section>

          <section>
            <h2>11. Regional Specific Information</h2>

            <h3>11.1 European Union (GDPR)</h3>
            <ul>
              <li><strong>Legal Basis:</strong> Consent, contract performance, legitimate interests</li>
              <li><strong>Data Controller:</strong> TasklApp</li>
            </ul>

            <h3>11.2 California (CCPA)</h3>
            <p>California residents have additional rights under the California Consumer Privacy Act:</p>
            <ul>
              <li>Right to know about personal information collected</li>
              <li>Right to delete personal information</li>
              <li>Right to opt-out of sale (we do not sell personal information)</li>
              <li>Right to non-discrimination</li>
            </ul>
          </section>
        </div>

        <div className={styles.footer}>
          <p>
            This Privacy Policy is designed to be transparent about our data practices. 
            If you have questions or need clarification, please don't hesitate to contact us.
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default PrivacyPage;
