import React from 'react';
import { useTranslation } from '@/i18n/TranslationContext';
import { Link } from 'react-router-dom';

const InformationContent: React.FC = () => {
  const { t } = useTranslation();

  return (
    <main>
      <div className="settings-container">
        <section className="settings-section">
          <h2 className="settings-section-title">{t('information.aboutProject')}</h2>
          <p>
            {t('information.aboutProjectDescription')}
          </p>
        </section>

        <section className="settings-section">
          <h2 className="settings-section-title">{t('information.keyFeatures')}</h2>
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

        <section className="settings-section">
          <h2 className="settings-section-title">{t('settings.project')}</h2>
          <div className="settings-social-buttons">
            <Link to="/settings/social/github" className="settings-social-button">
              <i className="fa-brands fa-github"></i>
            </Link>
            <Link to="/settings/social/gitlab" className="settings-social-button">
              <i className="fa-brands fa-gitlab"></i>
            </Link>
            <Link to="/settings/social/zip" className="settings-social-button">
              <i className="fa-brands fa-file"></i>
            </Link>
            <Link to="/settings/social/yandex_disk" className="settings-social-button">
              <i className="fa-brands fa-yandex"></i>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
};

export default InformationContent;