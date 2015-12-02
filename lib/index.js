'use strict';

var url = require('url');
var JiraApi = require('jira').JiraApi;
var DEFAULT_JIRA_URL = 'http://localhost:8080/jira';
var PATTERN = /!jira (.*)/i;

module.exports = function(bot, options) {

  var q = bot.q;
  var logger = bot.logger;
  var user = process.env.JIRA_USER || options.user;
  var password = process.env.JIRA_PASSWORD || options.password;
  var apiVersion = options.apiVersion || 'latest';
  var match = options.match || PATTERN;

  var jira = new JiraApi('https', options.host, options.port, user, password, apiVersion, null, null, null, options.path || '');

  function getIssueUrl(issue) {
    return url.format({
      protocol: options.protocol || 'https',
      hostname: options.host,
      pathname: (options.path || '') + '/browse/' + issue.key
    });
  }

  bot.listen(match, options, function(response) {
    logger.debug('JIRA issue detected', response.message.text);
    var issueNumber = response.match[1];
    if (!issueNumber) {
      return logger.error('No issue');
    }

    jira.findIssue(issueNumber, function(error, issue) {
      if (error) {
        return logger.error('Error while getting JIRA issue', error);
      }

      var link = getIssueUrl(issue);
      var result = `<${link}|${issue.key}> — ${issue.fields.status.name}, ${issue.fields.assignee.name} — ${issue.fields.summary}`;

      response.sendRichText(result);
    });
  });
};
