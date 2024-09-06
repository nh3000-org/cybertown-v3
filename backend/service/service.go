package service

import (
	"backend/db"
	"backend/types"
	"backend/utils"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
)

type Service struct {
	conf *types.Config
	repo *db.Repo
}

func NewService(conf *types.Config, repo *db.Repo) *Service {
	return &Service{
		conf: conf,
		repo: repo,
	}
}

const (
	googleOAuthTokenURL    = "https://oauth2.googleapis.com/token"
	googleOAuthUserInfoURL = "https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token="
)

func (s *Service) GetGoogleOAuthTokens(code string) (*types.GoogleOAuthToken, error) {
	data := url.Values{}
	data.Set("code", code)
	data.Set("client_id", s.conf.GoogleOAuth.ClientID)
	data.Set("client_secret", s.conf.GoogleOAuth.ClientSecret)
	data.Set("redirect_uri", s.conf.GoogleOAuth.RedirectURL)
	data.Set("grant_type", "authorization_code")

	req, err := http.NewRequest(http.MethodPost, googleOAuthTokenURL, strings.NewReader(data.Encode()))
	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")
	if err != nil {
		return nil, err
	}

	client := http.Client{}
	res, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to get google oauth tokens: received status code: %d", res.StatusCode)
	}

	var token types.GoogleOAuthToken
	err = json.NewDecoder(res.Body).Decode(&token)
	if err != nil {
		return nil, err
	}

	return &token, nil
}

func (s *Service) GetGoogleOAuthUserInfo(token *types.GoogleOAuthToken) (*types.GoogleUserInfo, error) {
	url := fmt.Sprintf("%s%s", googleOAuthUserInfoURL, token.AccessToken)

	req, err := http.NewRequest(http.MethodGet, url, nil)
	req.Header.Add("Authorization", "Bearer "+token.BearerToken)
	if err != nil {
		return nil, err
	}

	client := http.Client{}
	res, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to get user info: received status code: %d", res.StatusCode)
	}

	var u types.GoogleUserInfo
	err = json.NewDecoder(res.Body).Decode(&u)
	if err != nil {
		return nil, err
	}
	u.Picture = utils.ReplaceAfter(u.Picture, "=", "")

	return &u, nil
}
