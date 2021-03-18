<template>
<q-dialog v-model="showDialog" maximized transition-show="slide-up" transition-hide="slide-down" >
  <div :class="{ 'bg-white': !$q.dark.isActive, 'bg-dark': $q.dark.isActive, 'text-justify': true, 'no-scroll':true }">
    <q-toolbar >
      <q-toolbar-title />
      <q-btn
        @click="$emit('update:show', false)"
        class="q-pa-none"
        size="md"
        color="secondary"
        flat
        round
        icon="close"
        v-close-popup />
    </q-toolbar>
    <q-separator />
    <q-scroll-area style="height: 100%" class="q-pt-lg q-pl-lg q-pr-lg q-pb-xl">
      <h4 id="privacy-policy">Privacy Policy</h4>
      <p>Effective Date: January 06, 2020</p>
      <p>We respect and protect the privacy of our users. This Privacy Policy explains how we collect, use, and share information gathered through our website (www.xordrive.io, and any other site that links to this Privacy Policy), and other downloadable software applications (the “Apps”) (collectively, including the website and the Apps, the “Services”). It also describes your rights and choices with respect to your information, and how you can contact us if you have any questions or concerns. The terms “xordrive,” “we,” and “us” include xordrive.io, our affiliates, and subsidiaries.</p>
      <h4 id="1-personal-information-we-collect">1. Personal Information We Collect</h4>
      <p>We may collect Personal Information about you directly from you and automatically through your use of the Services, as well as from third parties. In this Policy, “Personal Information” means any information relating to an identified or identifiable individual.</p>
      <h5 id="a-personal-information-you-provide">A. Personal Information You Provide</h5>
      <ul>
      <li><p><strong>Communications</strong>. When you contact us or if you post on the Services, we may receive your account information, contact information, and the time, date, and content of your message and any attachments.</p>
      </li>
      <li><p><strong>Contact information</strong>. When you sign up to receive updates about our products and services you provide us with contact information, such as your name and email address.</p>
      </li>
      <li><p><strong>Contributor information</strong>. When you contribute to the xordrive project, you may provide us with contributor information, such as the code, documentation or other information you contribute, the time and date of your contributions, your username and profile information, public repository content, and any related comments and discussions.</p>
      </li>
      <li><p><strong>Order information</strong>. When you place an order in our online store, we may request certain information necessary to process your order, such as your contact information, shipping address, as well as credit card, cryptocurrency, or other billing information.</p>
      </li>
      </ul>
      <p>Where required by applicable law, we indicate whether and why you must provide us with your Personal Information, as well as the consequences of failing to do so.</p>
      <h5 id="b-personal-information-we-collect-automatically">B. Personal Information We Collect Automatically</h5>
      <ul>
      <li><strong>Usage information.</strong>  When you use our Services, our hosting provider may automatically collect information about your use of the Services. This information may include Personal Information, such as your IP address, web browser, device type, and the web pages that you visit just before or just after you use the Services, as well as information about your interactions with the Services, such as the date and time of your visit, and where you have clicked.</li>
      <li><strong>Cookies.</strong> Cookies are small pieces of text used to store information on web browsers. We don&#39;t use cookies in any of our Services, but third-party service providers we depend on may use cookies to detect malicious visitors and minimizes blocking legitimate users. It may be placed on the devices to identify individual clients behind a shared IP address and apply security settings on a per-client basis. You can find more information about how we use Cookies in the section <em>How We Use Cookies</em> below.</li>
      </ul>
      <h5 id="c-personal-information-we-collect-from-third-parties">C. Personal Information We Collect from Third Parties</h5>
      <ul>
      <li>Social media information. If you post on xordrive social media pages or post about xordrive on other publicly available services, we may receive social media information about you, such as your profile information and the time, date and content of your posts.</li>
      </ul>
      <h4 id="2-how-we-use-personal-information">2. How We Use Personal Information</h4>
      <h5 id="a-how-we-use-personal-information">A. How We Use Personal information</h5>
      <p>We use Personal Information we collect through the Services as necessary for the following purposes:</p>
      <ul>
      <li><p><strong>Providing the Services</strong>. We use Personal Information to operate, maintain, and provide features of the Services.</p>
      </li>
      <li><p><strong>Communicating with you</strong>. We use Personal Information to contact you for administrative and informational purposes, such as to respond to your inquiries, or to inform you about changes to our terms, conditions, and policies, or invitations to join the Services.</p>
      </li>
      <li><p><strong>Fulfilling your orders</strong>. We use Personal Information to fulfill your orders, including to process your payment and to ship your order.</p>
      </li>
      <li><p><strong>Marketing</strong>. We use Personal Information to send marketing communications, including promotional and advertising materials that may be useful, relevant, valuable or otherwise of interest relating to products and services offered by us. We also use Personal Information to contact you to answer feedback and surveys, and to improve our marketing and promotional efforts. Generally, you have the ability to opt out of receiving any promotional communications as described below under  <em>Your Rights and Choices</em>. Where required under applicable law, we will only send you promotional emails with your opt-in consent.</p>
      </li>
      <li><p><strong>Understanding and improving the Services</strong>. We use Personal Information to understand and analyze the usage trends and preferences of our users in order to improve the Services, and to develop new products, services, features, and functionalities.</p>
      </li>
      <li><p><strong>Other business purposes</strong>. We use Personal Information for compliance, risk management and other business purposes, such as audits, security, compliance with applicable laws and regulations, fraud monitoring and prevention.</p>
      </li>
      </ul>
      <h5 id="b-our-use-of-european-personal-information">B. Our Use of European Personal Information</h5>
      <p>If you are located in the European Economic Area, we only process your Personal Information when we have a valid “legal basis” to do so, including when:</p>
      <ul>
      <li><p>You have consented to the use of your Personal Information, for example to send you marketing communications.</p>
      </li>
      <li><p>We need to use your Personal Information to provide you with the Services, for example to give you access to the Services, or to respond to your inquiries.</p>
      </li>
      <li><p>We need to use your Personal Information to comply with a legal obligation, for example to comply with a court order.</p>
      </li>
      <li><p>We or a third party have a legitimate interest in using your Personal Information. In particular, we have a legitimate interest in using your Personal to understand and improve our Services, and to monitor and prevent fraud. We only rely on our or a third party’s legitimate interests to process your Personal Information when these interests are not overridden by your rights and interests.</p>
      </li>
      </ul>
      <h5 id="c-how-we-use-cookies">C. How We Use Cookies</h5>
      <p>The third-party service providers may use the following cookies to collect Personal Information:</p>
      <ul>
      <li><strong>Third-party content.</strong>  The Services contain links to websites operated by third parties and other content provided by third parties, such as the default Gaia hub provided by Blockstack PBC for storing the files. These third parties may collect information about you if you visit their websites, or if you visit a website that contains social media features or other content provided by them. This Privacy Policy does not address, and we do not control, what Personal Information these third parties collect. We encourage you review these third parties’ privacy policies and related privacy settings before using these features.</li>
      </ul>
      <p>You can find more information about your rights and choices, and how to opt out of the use of certain cookies in the section  <em>Your Rights and Choices</em>  below.</p>
      <h4 id="3-how-we-share-your-personal-information">3. How We Share Your Personal Information</h4>
      <p>Except as described in this Policy, we will not disclose your Personal Information collected on the Services to third parties without your consent. We may disclose information to third parties if you consent to us doing so, as well as in the following circumstances:</p>
      <ul>
      <li><p>To our third party service providers who provide services such as website hosting, authentication, decentralized storage (Gaia hub), information technology related infrastructure provision, customer service, email delivery, auditing, and other services.</p>
      </li>
      <li><p>To a potential or actual acquirer, successor, or assignee as part of any reorganization, merger, sale, joint venture, assignment, transfer or other disposition of all or any portion of our business, assets or stock (including in bankruptcy or similar proceedings).</p>
      </li>
      <li><p>If required to do so by law or in the good faith belief that such action is appropriate: (a) under applicable law, including laws outside your country of residence; (b) to comply with legal process; (c) to respond to requests from public and government authorities, including public and government authorities outside your country of residence; (d) to enforce our terms and conditions; (e) to protect our operations or those of any of our affiliates; (f) to protect our rights, privacy, safety or property, and/or that of our affiliates, you or others; and (g) to allow us to pursue available remedies or limit the damages that we may sustain.</p>
      </li>
      <li><p>We may use and disclose aggregated or otherwise de-identified information for any purpose, unless we are prohibited from doing so under applicable law.</p>
      </li>
      </ul>
      <h4 id="4-third-party-services">4. Third Party Services</h4>
      <p>This Privacy Policy does not address, and we are not responsible for, the privacy, information or other practices of any third parties, or any third party operating any site or service to which the Services link. The inclusion of a link on the Services does not imply endorsement of the linked site or service by us or by our affiliates. We encourage you to learn about third-parties’ privacy and security policies before providing them with information.</p>
      <h4 id="5-security">5. Security</h4>
      <p>We use certain physical, organizational, and technical safeguards that are designed to maintain the integrity and security of information that we collect. Please be aware that no security measures are perfect or impenetrable and thus we cannot and do not guarantee the security of your data. It is important that you maintain the security and control of your credentials, and not share your passwords or private keys with anyone.</p>
      <h4 id="6-your-rights-and-choices">6. Your Rights and Choices</h4>
      <p>You have several rights and choices with regard to our use of your Personal Information. You may, of course, decline to share certain Personal Information with us, in which case we may not be able to provide to you some of the features and functionality of the Services. If you wish to access, amend, or delete any other Personal Information we hold about you, you may contact us using the contact details at the end of this Policy. Please note that while any changes you make will be reflected in active user databases instantly or within a reasonable period of time, we may retain all information you submit for backups, archiving, prevention of fraud and abuse, analytics, satisfaction of legal obligations, or where we otherwise reasonably believe that we have a legitimate reason to do so, as permitted under applicable data protection law. From time to time, we send marketing email messages to our users. If you no longer want to receive such emails from us on a going forward basis, you may opt-out via the “unsubscribe” link provided in each such email or by contacting us using the contact details at the end of this Policy.</p>
      <h5 id="a-your-european-privacy-rights">A. Your European Privacy Rights</h5>
      <p>If you are located in the European Economic Area, you have additional rights described below.</p>
      <ul>
      <li><p>You may request access to and receive information about the Personal Information we maintain about you, update and correct inaccuracies in your Personal Information, restrict or object to the processing of your Personal Information, have the information anonymized or deleted, as appropriate, or exercise your right to data portability to easily transfer your Personal Information to another company. In addition, you may also have the right to lodge a complaint with a supervisory authority, including in your country of residence, place of work, or where an incident took place.</p>
      </li>
      <li><p>You may withdraw any consent you previously provided to us regarding the processing of your Personal Information, at any time, and free of charge. We will apply your preferences going forward and this will not affect the lawfulness of the processing before you withdrew your consent.</p>
      </li>
      </ul>
      <p>You may exercise these rights by contacting us using the contact details at the end of this Policy. Please note that there are exceptions and limitations to each of these rights, and that while any changes you make will be reflected in active user databases instantly or within a reasonable period of time, we may retain information for backups, archiving, prevention of fraud and abuse, analytics, satisfaction of legal obligations, or where we otherwise reasonably believe that we have a legitimate reason to do so.</p>
      <h5 id="b-your-cookie-choices">B. Your Cookie Choices</h5>
      <p>You have the following choices with regard to the use of cookies and similar technologies:</p>
      <ul>
      <li><p><strong>Browser settings</strong>. Many web browsers allow you to manage your preferences relating to cookies. You can set your browser to refuse cookies or delete certain cookies. You may be able to manage other technologies in the same way that you manage cookies using your browser’s preferences. Please note that if you choose to block cookies, doing so may impair the use of our Services.m </p>
      </li>
      <li><p><strong>Do Not Track Signals</strong>. There is no accepted standard on how to respond to Do Not Track signals, and we do not respond to such signals.</p>
      </li>
      </ul>
      <h4 id="7-use-of-services-by-minors">7. Use of Services by Minors</h4>
      <p>The Services are not directed to individuals under the age of thirteen (13), and we request that they not provide personal information through the Services. If you learn that a child under 13 has provided us with personal information in violation of this Privacy Policy, then you may alert us at  xordrive@pm.me .</p>
      <h4 id="8-international-visitors">8. International Visitors</h4>
      <p>We uses servers hosted in the United States and is intended for users in the United States. If you choose to use the Services from regions of the world with laws governing data collection and use that may differ from U.S. law, please note that we may be transferring your information outside of your region for storage and processing in the United States and around the globe. By using the Services you consent to the transfer of information to countries outside of your country of residence, including the United States, which may have data protection rules that are different from those of your country.</p>
      <h5 id="european-visitors">European Visitors</h5>
      <p>If you are located in the European Economic Area, we will comply with applicable EEA data protection law when transferring your Personal Information outside of the EEA. We may transfer your Personal Information to countries which have been found to provide adequate protection by the EU Commission (e.g., Canada), use contractual protections for the transfer of Personal Information, or transfer to recipients who have certified to the Privacy Shield or adopted Binding Corporate Rules. For more information about how we transfer Personal Information outside of the EEA, or to obtain a copy of the contractual safeguards we use for such transfers, you may contact us as specified below.</p>
      <h4 id="9-retention">9. Retention</h4>
      <p>We take measures to delete your Personal Information or keep it in a form that does not permit identifying you when this information is no longer necessary for the purposes for which we process it, unless we are required or permitted by law to keep this information for a longer period. When determining the specific retention period, we take into account various criteria, such as the type of Services provided to you, the nature and length of our relationship with you, and mandatory retention periods provided by law and the relevant statute of limitations.</p>
      <h4 id="10-updates-to-this-privacy-policy">10. Updates to this Privacy Policy</h4>
      <p>We may make changes to this Privacy Policy. The “Effective Date” at the top of this page indicates when this Privacy Policy became effective. If we make material changes, we may notify you through the Services or may send you an email or other communication. We encourage you to read this Privacy Policy periodically to stay up-to-date about our privacy practices. Your use of the Services following these changes means that you accept the revised Privacy Policy.</p>
      <h4 id="11-contact-us">11. Contact Us</h4>
      <p>Unless otherwise indicated in this Privacy Policy, xordrive is the entity responsible or “data controller” for the processing of Personal Information described in this Privacy Policy. If you have any questions about this Privacy Policy or our privacy practices in general, please contact via email at: xordrive@pm.me </p>
      <q-separator spaced />
    </q-scroll-area>
  </div>
</q-dialog>
</template>

<script>
export default {
  name: 'Privacy',
  props: {
    show: {
      type: Boolean
    }
  },
  data () {
    return {
      showDialog: false
    }
  },
  watch: {
    show (value) {
      this.showDialog = value
    }
  }
}
</script>
