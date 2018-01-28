export default class User {
  private _name: string;
  public set name(val) {
    this._name = val;
  };
  public get name() {
    return this._name;
  };
  private _streamlabsToken: string;
  public set streamlabsToken(val) {
    this._streamlabsToken = val;
  };
  public get streamlabsToken() {
    return this._streamlabsToken;
  };
  private _twitchToken: string;
  public set twitchToken(val) {
    this._twitchToken = val;
  };
  public get twitchToken() {
    return this._twitchToken;
  };
  private _twitchFollowersLink: string;
  public set twitchFollowersLink(val) {
    this._twitchFollowersLink = val;
  };
  public get twitchFollowersLink() {
    return this._twitchFollowersLink;
  };
  private _twitchSubscriptionsLink: string;
  public set twitchSubscriptionsLink(val) {
    this._twitchSubscriptionsLink = val;
  };
  public get twitchSubscriptionsLink() {
    return this._twitchSubscriptionsLink;
  };
  constructor(
  ) {}
}
