import React from 'react';
import { useTranslation } from '@/i18n/TranslationContext';

const InformationContent: React.FC = () => {
  const { t } = useTranslation();

  return (
    <main>
      <div className="settings-container">
      <section className="information-section">
        <h2>{t('information.aboutProject')}</h2>
        <p>
          {t('information.aboutProjectDescription')}
        </p>
      </section>

      <section className="information-section">
        <h2>{t('information.keyFeatures')}</h2>
        <div className="features-grid">
          <div className="feature-item">
            <h3>{t('information.taskManagement')}</h3>
            <p>{t('information.taskManagementDescription')}</p>
          </div>
          <div className="feature-item">
            <h3>{t('information.userFriendlyInterface')}</h3>
            <p>{t('information.userFriendlyInterfaceDescription')}</p>
          </div>
          <div className="feature-item">
            <h3>{t('information.progressTracking')}</h3>
            <p>{t('information.progressTrackingDescription')}</p>
          </div>
        </div>
      </section>

      <section className="information-section">
        <h2>{t('information.contact')}</h2>
        <p>{t('information.contactDescription')}</p>
        <div className="contact-info">
          <a href="mailto:contact@onceyou.com" className="contact-link">contact@onceyou.com</a>
        </div>
      </section>
      </div>
    </main>
  );
};

export default InformationContent;