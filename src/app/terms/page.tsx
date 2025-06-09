'use client';

import React from 'react';
import AppLayout from '../../components/layout/AppLayout';
import styles from '../privacy/Privacy.module.css'; // Reusing the same styles

const TermsPage: React.FC = () => {
  return (
    <AppLayout>
      <div className={styles.privacyContainer}>
        <div className={styles.header}>
          <h1>Terms of Service</h1>
          <p className={styles.lastUpdated}>
            <strong>Effective Date:</strong> June 9, 2025<br />
            <strong>Last Updated:</strong> June 9, 2025
          </p>
        </div>

        <div className={styles.content}>
          <section>
            <h2>1. Acceptance of Terms</h2>
            <p>
              Welcome to TasklApp! These Terms of Service ("Terms") govern your use of TasklApp's web application, 
              Chrome extension, and related services (collectively, the "Service") operated by TasklApp ("we," "us," or "our").
            </p>
            <p>
              By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part 
              of these terms, then you may not access the Service.
            </p>
          </section>

          <section>
            <h2>2. Description of Service</h2>
            <p>TasklApp is a competitive task management platform that allows users to:</p>
            <ul>
              <li>Create, assign, and track tasks</li>
              <li>Connect with friends and collaborate on task completion</li>
              <li>Compete on leaderboards based on task completion performance</li>
              <li>Receive notifications for task assignments and updates</li>
              <li>Access the service through both web application and Chrome extension</li>
            </ul>
            <p>
              Our mission is to make productivity fun and competitive by treating task completion like running laps on a track.
            </p>
          </section>

          <section>
            <h2>3. User Accounts</h2>

            <h3>3.1 Account Creation</h3>
            <ul>
              <li>You must provide accurate and complete information when creating an account</li>
              <li>You are responsible for maintaining the security of your account credentials</li>
              <li>You must be at least 13 years old to use our Service</li>
              <li>One person may not maintain more than one account</li>
            </ul>

            <h3>3.2 Account Responsibilities</h3>
            <ul>
              <li>You are responsible for all activities that occur under your account</li>
              <li>You must notify us immediately of any unauthorized use of your account</li>
              <li>You must keep your contact information up to date</li>
              <li>You may not transfer your account to another person</li>
            </ul>
          </section>

          <section>
            <h2>4. Acceptable Use</h2>

            <h3>4.1 Permitted Uses</h3>
            <p>You may use our Service to:</p>
            <ul>
              <li>Create and manage personal and collaborative tasks</li>
              <li>Connect with friends and colleagues for productivity purposes</li>
              <li>Track your progress and compete on leaderboards</li>
              <li>Receive notifications about task assignments and deadlines</li>
            </ul>

            <h3>4.2 Prohibited Uses</h3>
            <p>You may not use our Service to:</p>
            <ul>
              <li>Create tasks that are illegal, harmful, or violate others' rights</li>
              <li>Harass, bully, or intimidate other users</li>
              <li>Share inappropriate, offensive, or explicit content</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Use the Service for commercial purposes without permission</li>
              <li>Create fake accounts or impersonate others</li>
              <li>Spam other users with unwanted tasks or messages</li>
              <li>Use automated tools to create accounts or manipulate the Service</li>
            </ul>
          </section>

          <section>
            <h2>5. Content and Intellectual Property</h2>

            <h3>5.1 Your Content</h3>
            <ul>
              <li>You retain ownership of content you create (tasks, descriptions, comments)</li>
              <li>You grant us a license to use your content to provide the Service</li>
              <li>You are responsible for ensuring your content doesn't violate others' rights</li>
              <li>We may remove content that violates these Terms</li>
            </ul>

            <h3>5.2 Our Content</h3>
            <ul>
              <li>TasklApp and its original content are protected by intellectual property laws</li>
              <li>You may not copy, modify, or distribute our content without permission</li>
              <li>Our trademarks and logos may not be used without written consent</li>
            </ul>
          </section>

          <section>
            <h2>6. Privacy and Data</h2>
            <p>
              Your privacy is important to us. Our collection and use of personal information is governed by our 
              <a href="/privacy">Privacy Policy</a>, which is incorporated into these Terms by reference.
            </p>
            <p>Key points about data handling:</p>
            <ul>
              <li>We collect information necessary to provide the Service</li>
              <li>We use industry-standard security measures to protect your data</li>
              <li>We do not sell your personal information to third parties</li>
              <li>You can request data deletion by contacting us</li>
            </ul>
          </section>

          <section>
            <h2>7. Chrome Extension</h2>

            <h3>7.1 Installation and Use</h3>
            <ul>
              <li>Our Chrome extension is provided as an additional way to access TasklApp</li>
              <li>The extension requires certain permissions to function properly</li>
              <li>You can uninstall the extension at any time through Chrome's settings</li>
            </ul>

            <h3>7.2 Extension Permissions</h3>
            <div className={styles.highlight}>
              <h4>We request these permissions for the following purposes:</h4>
              <ul>
                <li><strong>Tabs:</strong> To help you create tasks with current page context</li>
                <li><strong>Storage:</strong> To maintain your login state locally</li>
                <li><strong>Host Permissions:</strong> For technical functionality across websites</li>
              </ul>
            </div>

            <h3>7.3 Extension Limitations</h3>
            <ul>
              <li>The extension does not monitor your browsing activity</li>
              <li>We do not collect data from websites you visit</li>
              <li>Extension functionality may vary based on Chrome updates</li>
            </ul>
          </section>

          <section>
            <h2>8. Payment Terms</h2>

            <h3>8.1 Free Service</h3>
            <p>TasklApp offers a free tier with basic functionality available to all users.</p>

            <h3>8.2 Premium Features</h3>
            <ul>
              <li>Premium features may be offered for a subscription fee</li>
              <li>Billing is handled securely through Stripe</li>
              <li>Subscriptions renew automatically unless canceled</li>
              <li>Refunds are handled according to our refund policy</li>
            </ul>

            <h3>8.3 Changes to Pricing</h3>
            <ul>
              <li>We may change pricing for premium features with notice</li>
              <li>Existing subscribers will be notified of price changes</li>
              <li>You may cancel your subscription at any time</li>
            </ul>
          </section>

          <section>
            <h2>9. Service Availability</h2>

            <h3>9.1 Uptime</h3>
            <ul>
              <li>We strive to maintain high service availability</li>
              <li>Occasional maintenance and updates may cause temporary downtime</li>
              <li>We are not liable for service interruptions beyond our control</li>
            </ul>

            <h3>9.2 Changes to Service</h3>
            <ul>
              <li>We may modify, suspend, or discontinue features with notice</li>
              <li>We reserve the right to impose usage limits</li>
              <li>Major changes will be communicated to users in advance</li>
            </ul>
          </section>

          <section>
            <h2>10. User Conduct and Enforcement</h2>

            <h3>10.1 Community Guidelines</h3>
            <ul>
              <li>Be respectful and professional in all interactions</li>
              <li>Create meaningful and appropriate tasks</li>
              <li>Respect others' time and commitments</li>
              <li>Report violations of these Terms to us</li>
            </ul>

            <h3>10.2 Enforcement Actions</h3>
            <p>If you violate these Terms, we may:</p>
            <ul>
              <li>Issue warnings or temporary restrictions</li>
              <li>Remove violating content</li>
              <li>Suspend or terminate your account</li>
              <li>Report illegal activities to authorities</li>
            </ul>
          </section>

          <section>
            <h2>11. Disclaimers and Limitations</h2>

            <h3>11.1 Service Disclaimer</h3>
            <div className={styles.highlight}>
              <p>
                <strong>The Service is provided "as is" without warranties of any kind.</strong> We do not guarantee 
                that the Service will be error-free, secure, or continuously available.
              </p>
            </div>

            <h3>11.2 Limitation of Liability</h3>
            <ul>
              <li>We are not liable for indirect, incidental, or consequential damages</li>
              <li>Our total liability is limited to the amount you paid us in the past 12 months</li>
              <li>We are not responsible for user-generated content or third-party actions</li>
            </ul>

            <h3>11.3 User Responsibility</h3>
            <ul>
              <li>You use the Service at your own risk</li>
              <li>You are responsible for backing up important data</li>
              <li>You should not rely solely on our Service for critical task management</li>
            </ul>
          </section>

          <section>
            <h2>12. Indemnification</h2>
            <p>
              You agree to indemnify and hold us harmless from any claims, damages, or expenses arising from:
            </p>
            <ul>
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any third-party rights</li>
              <li>Your content or conduct on the Service</li>
            </ul>
          </section>

          <section>
            <h2>13. Termination</h2>

            <h3>13.1 Termination by You</h3>
            <ul>
              <li>You may delete your account at any time</li>
              <li>Account deletion will remove your data according to our data retention policy</li>
              <li>You remain responsible for activities that occurred before termination</li>
            </ul>

            <h3>13.2 Termination by Us</h3>
            <ul>
              <li>We may terminate accounts that violate these Terms</li>
              <li>We may terminate the Service with reasonable notice</li>
              <li>We will attempt to provide data export options when possible</li>
            </ul>
          </section>

          <section>
            <h2>14. Legal and Jurisdictional Issues</h2>

            <h3>14.1 Governing Law</h3>
            <p>
              These Terms are governed by the laws of the jurisdiction where TasklApp is headquartered, 
              without regard to conflict of law principles.
            </p>

            <h3>14.2 Dispute Resolution</h3>
            <ul>
              <li>We prefer to resolve disputes through direct communication</li>
              <li>Serious disputes may be subject to binding arbitration</li>
              <li>You may have rights under local consumer protection laws</li>
            </ul>

            <h3>14.3 International Use</h3>
            <ul>
              <li>The Service may not be available in all countries</li>
              <li>You are responsible for compliance with local laws</li>
              <li>Export restrictions may apply to some features</li>
            </ul>
          </section>

          <section>
            <h2>15. Changes to Terms</h2>
            <p>We may update these Terms from time to time. When we do:</p>
            <ul>
              <li>We will notify users of significant changes</li>
              <li>Continued use of the Service constitutes acceptance of new Terms</li>
              <li>You may terminate your account if you disagree with changes</li>
            </ul>
            <p>We encourage you to review these Terms periodically.</p>
          </section>

          <section>
            <h2>16. Contact Information</h2>
            <p>If you have questions about these Terms, please contact us:</p>
            <div className={styles.contactInfo}>
              <p><strong>Email:</strong> <a href="mailto:legal@taskl.app">legal@taskl.app</a></p>
              <p><strong>Support:</strong> <a href="mailto:support@taskl.app">support@taskl.app</a></p>
              <p><strong>General:</strong> <a href="mailto:hello@taskl.app">hello@taskl.app</a></p>
            </div>
          </section>

          <section>
            <h2>17. Miscellaneous</h2>

            <h3>17.1 Entire Agreement</h3>
            <p>
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and TasklApp.
            </p>

            <h3>17.2 Severability</h3>
            <p>
              If any provision of these Terms is found to be invalid, the remaining provisions will continue in full force.
            </p>

            <h3>17.3 Assignment</h3>
            <p>
              We may assign these Terms to another entity, but you may not assign your rights without our consent.
            </p>

            <h3>17.4 No Waiver</h3>
            <p>
              Our failure to enforce any provision does not constitute a waiver of that provision.
            </p>
          </section>
        </div>

        <div className={styles.footer}>
          <p>
            Thank you for using TasklApp! These Terms help ensure a positive experience for all users. 
            If you have questions, we're here to help.
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default TermsPage;
